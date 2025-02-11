import * as fs from 'fs';
import * as path from 'path';
import { Language } from '../src/services/i18n/types';

interface ValidationResult {
    missingKeys: string[];
    extraKeys: string[];
    emptyValues: string[];
}

interface ValidationReport {
    [locale: string]: ValidationResult;
}

function flattenTranslations(obj: any, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {};

    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const nested = flattenTranslations(obj[key], prefix ? `${prefix}.${key}` : key);
            Object.assign(flattened, nested);
        } else {
            flattened[prefix ? `${prefix}.${key}` : key] = obj[key];
        }
    }

    return flattened;
}

function validateTranslations(): ValidationReport {
    const localesDir = path.join(__dirname, '..', 'src', 'locales');
    const report: ValidationReport = {};
    
    // Read English translations as base
    const enPath = path.join(localesDir, 'en.json');
    const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    const flatEn = flattenTranslations(enTranslations);
    const enKeys = new Set(Object.keys(flatEn));

    // Validate other locales
    const locales = ['ru'];
    locales.forEach(locale => {
        const localePath = path.join(localesDir, `${locale}.json`);
        const localeTranslations = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
        const flatLocale = flattenTranslations(localeTranslations);
        const localeKeys = new Set(Object.keys(flatLocale));

        const missingKeys = [...enKeys].filter(key => !localeKeys.has(key));
        const extraKeys = [...localeKeys].filter(key => !enKeys.has(key));
        const emptyValues = Object.entries(flatLocale)
            .filter(([_, value]) => value === '')
            .map(([key]) => key);

        report[locale] = {
            missingKeys,
            extraKeys,
            emptyValues,
        };
    });

    return report;
}

function generateValidationReport(report: ValidationReport): string {
    let output = '# Translation Validation Report\n\n';
    output += `Generated on: ${new Date().toLocaleString()}\n\n`;

    Object.entries(report).forEach(([locale, result]) => {
        output += `## ${locale.toUpperCase()}\n\n`;

        if (result.missingKeys.length === 0 && 
            result.extraKeys.length === 0 && 
            result.emptyValues.length === 0) {
            output += '✅ All translations are complete and valid\n\n';
            return;
        }

        if (result.missingKeys.length > 0) {
            output += '### Missing Keys\n';
            result.missingKeys.forEach(key => {
                output += `- \`${key}\`\n`;
            });
            output += '\n';
        }

        if (result.extraKeys.length > 0) {
            output += '### Extra Keys\n';
            result.extraKeys.forEach(key => {
                output += `- \`${key}\`\n`;
            });
            output += '\n';
        }

        if (result.emptyValues.length > 0) {
            output += '### Empty Values\n';
            result.emptyValues.forEach(key => {
                output += `- \`${key}\`\n`;
            });
            output += '\n';
        }
    });

    return output;
}

// Run validation
const report = validateTranslations();
const reportContent = generateValidationReport(report);
const reportPath = path.join(__dirname, '..', 'translation-validation.md');
fs.writeFileSync(reportPath, reportContent);

// Check if there are any issues
const hasIssues = Object.values(report).some(result => 
    result.missingKeys.length > 0 || 
    result.extraKeys.length > 0 || 
    result.emptyValues.length > 0
);

if (hasIssues) {
    console.error('❌ Translation validation failed. See translation-validation.md for details.');
    process.exit(1);
} else {
    console.log('✅ All translations are valid!');
} 