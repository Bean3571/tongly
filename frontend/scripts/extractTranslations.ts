import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

interface TranslationKey {
    key: string;
    defaultValue: string;
    description?: string;
    files: string[];
}

interface TranslationMap {
    [key: string]: TranslationKey;
}

const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', 'coverage'];
const COMPONENT_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

function extractTextFromJSX(content: string): string[] {
    const texts: string[] = [];
    
    // Match translation keys from t() function calls
    const translationKeyRegex = /t\(['"]([^'"]+)['"]/g;
    let match;
    while ((match = translationKeyRegex.exec(content)) !== null) {
        const key = match[1].trim();
        if (key) {
            texts.push(key);
        }
    }

    // Match text between JSX tags, excluding specific patterns
    const jsxTextRegex = />([^<>{}"']+)</g;
    while ((match = jsxTextRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && 
            !text.includes('{') && 
            !text.includes('}') && 
            !text.match(/^\d+$/) && 
            !text.match(/^[A-Z_]+$/) &&
            text.length > 1) {
            texts.push(text);
        }
    }

    // Match text in common attributes
    const attrTextRegex = /(?:title|placeholder|label|description|message|alt|aria-label)=["']([^"']+)["']/g;
    while ((match = attrTextRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && 
            !text.includes('{{') && 
            !text.includes('}}') && 
            !text.includes('{t(') &&
            text.length > 1) {
            texts.push(text);
        }
    }

    // Match string literals in component code
    const stringLiteralRegex = /['"]([^'"]+)['"]/g;
    while ((match = stringLiteralRegex.exec(content)) !== null) {
        const text = match[1].trim();
        if (text && 
            text.length > 1 && 
            !text.includes('{{') && 
            !text.includes('}}') &&
            !text.includes('{t(') &&
            !text.match(/^\d+$/) &&
            !text.match(/^[A-Z_]+$/) &&
            !text.startsWith('http') &&
            !text.startsWith('./') &&
            !text.startsWith('../') &&
            !text.endsWith('.ts') &&
            !text.endsWith('.tsx') &&
            !text.endsWith('.js') &&
            !text.endsWith('.jsx') &&
            !text.includes('*')) {
            texts.push(text);
        }
    }

    return Array.from(new Set(texts));
}

function generateTranslationKey(text: string): string {
    // If the text is already a translation key (contains dots), return it as is
    if (text.includes('.')) {
        return text;
    }

    // Otherwise, convert text to lowercase and remove special characters
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '.');
}

function getContextFromFilePath(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1].replace(/\.[^/.]+$/, '');
    
    if (filePath.includes('/pages/')) {
        return `pages.${fileName.toLowerCase()}`;
    } else if (filePath.includes('/components/')) {
        return `components.${fileName.toLowerCase()}`;
    }
    
    return fileName.toLowerCase();
}

function scanDirectory(dir: string): TranslationMap {
    const translations: TranslationMap = {};
    const files = glob.sync(`${dir}/**/*`, {
        ignore: EXCLUDED_DIRS.map(d => `**/${d}/**`),
    });

    files.forEach(file => {
        if (!COMPONENT_EXTENSIONS.includes(extname(file))) {
            return;
        }

        const content = readFileSync(file, 'utf-8');
        const texts = extractTextFromJSX(content);

        texts.forEach(text => {
            const key = text.includes('.') ? text : generateTranslationKey(text);
            if (!translations[key]) {
                translations[key] = {
                    key,
                    defaultValue: text,
                    files: [file],
                };
            } else if (!translations[key].files.includes(file)) {
                translations[key].files.push(file);
            }
        });
    });

    return translations;
}

function mergeWithExistingTranslations(
    newTranslations: TranslationMap,
    existingTranslations: any,
    locale: string
): any {
    const merged = { ...existingTranslations };

    Object.values(newTranslations).forEach(({ key, defaultValue }) => {
        const keyParts = key.split('.');
        let current = merged;

        // Create nested structure
        for (let i = 0; i < keyParts.length - 1; i++) {
            const part = keyParts[i];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }

        // Set value if it doesn't exist
        const lastPart = keyParts[keyParts.length - 1];
        if (!current[lastPart]) {
            current[lastPart] = locale === 'en' ? defaultValue : defaultValue;
        }
    });

    return merged;
}

function generateTranslationFiles(translations: TranslationMap) {
    const locales = ['en', 'ru'];
    
    locales.forEach(locale => {
        const filePath = join(__dirname, '..', 'src', 'locales', `${locale}.json`);
        let existing = {};
        
        if (existsSync(filePath)) {
            existing = JSON.parse(readFileSync(filePath, 'utf-8'));
        }

        const merged = mergeWithExistingTranslations(translations, existing, locale);
        writeFileSync(filePath, JSON.stringify(merged, null, 4));
    });

    // Generate translation keys type file
    const keysPath = join(__dirname, '..', 'src', 'types', 'translationKeys.ts');
    const translationKeys = Object.keys(translations);
    let typeContent: string;
    
    if (translationKeys.length > 0) {
        const keyTypes = translationKeys.map(key => `  | '${key}'`).join('\n');
        typeContent = `export type TranslationKey =\n  | string${keyTypes};\n`;
    } else {
        typeContent = `export type TranslationKey = string;\n`;
    }
    
    writeFileSync(keysPath, typeContent);

    // Generate report
    const reportPath = join(__dirname, '..', 'translation-report.md');
    const report = generateReport(translations);
    writeFileSync(reportPath, report);
}

function generateReport(translations: TranslationMap): string {
    let report = '# Translation Report\n\n';
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    report += `Total translation keys: ${Object.keys(translations).length}\n\n`;

    // Group by context
    const groupedTranslations: { [context: string]: TranslationKey[] } = {};
    Object.values(translations).forEach(translation => {
        const context = translation.key.split('.')[0];
        if (!groupedTranslations[context]) {
            groupedTranslations[context] = [];
        }
        groupedTranslations[context].push(translation);
    });

    // Generate report by context
    Object.entries(groupedTranslations)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([context, keys]) => {
            report += `## ${context}\n\n`;
            keys.sort((a, b) => a.key.localeCompare(b.key))
                .forEach(({ key, defaultValue, files }) => {
                    report += `### ${key}\n`;
                    report += `- Default value: "${defaultValue}"\n`;
                    report += `- Used in files:\n`;
                    files.forEach(file => {
                        report += `  - ${file.replace(/^.*?src\//, 'src/')}\n`;
                    });
                    report += '\n';
                });
        });

    return report;
}

// Run the script
const srcDir = join(__dirname, '..', 'src');
const translations = scanDirectory(srcDir);
generateTranslationFiles(translations);

console.log('Translation files generated successfully!'); 