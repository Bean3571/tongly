import { Language, LocaleConfig, LocaleData, TranslationVariables, PluralRules } from './types';

export const SUPPORTED_LOCALES: Record<Language, LocaleConfig> = {
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
        rtl: false,
    },
    ru: {
        code: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        flag: '🇷🇺',
        rtl: false,
    },
};

type PluralRule = 'zero' | 'one' | 'few' | 'many' | 'other';

interface TranslationWithMessage {
    message: string | PluralRules;
    description?: string;
}

class I18nService {
    private locales: Record<Language, LocaleData> = {} as Record<Language, LocaleData>;
    private currentLocale: Language = 'ru';
    private fallbackLocale: Language = 'ru';

    constructor() {
        // Initialize with browser language or stored preference
        this.currentLocale = this.getInitialLocale();
        // Immediately load the Russian locale
        this.loadLocale('ru').catch(err => {
            console.error('Failed to load Russian locale:', err);
        });
    }

    private getInitialLocale(): Language {
        // Check localStorage first
        const storedLocale = localStorage.getItem('locale') as Language;
        if (storedLocale && SUPPORTED_LOCALES[storedLocale]) {
            return storedLocale;
        }

        // Check browser language
        const browserLang = navigator.language.split('-')[0] as Language;
        if (SUPPORTED_LOCALES[browserLang]) {
            return browserLang;
        }

        // Default to Russian
        return 'ru';
    }

    async loadLocale(locale: Language): Promise<void> {
        if (this.locales[locale]) {
            return;
        }

        try {
            const module = await import(`../../locales/${locale}.json`);
            const translations = module.default;

            this.locales[locale] = {
                locale,
                translations,
                pluralRules: new Intl.PluralRules(locale),
                numberFormat: new Intl.NumberFormat(locale),
                dateFormat: new Intl.DateTimeFormat(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                currencyFormat: new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: locale === 'ru' ? 'RUB' : 'USD',
                }),
            };
        } catch (error) {
            console.error(`Failed to load locale: ${locale}`, error);
            throw error;
        }
    }

    async setLocale(locale: Language): Promise<void> {
        if (!SUPPORTED_LOCALES[locale]) {
            throw new Error(`Unsupported locale: ${locale}`);
        }

        await this.loadLocale(locale);
        this.currentLocale = locale;
        localStorage.setItem('locale', locale);

        // Update document attributes
        document.documentElement.lang = locale;
        document.documentElement.dir = SUPPORTED_LOCALES[locale].rtl ? 'rtl' : 'ltr';
    }

    private getNestedTranslation(obj: any, path: string[]): string | PluralRules | undefined {
        const result = path.reduce((prev, curr) => prev?.[curr], obj);
        if (typeof result === 'string' || (result && this.isPluralRules(result))) {
            return result;
        }
        return undefined;
    }

    private isPluralRules(obj: any): obj is PluralRules {
        return (
            obj &&
            typeof obj === 'object' &&
            ('one' in obj || 'other' in obj)
        );
    }

    private isTranslationWithMessage(obj: any): obj is TranslationWithMessage {
        return (
            obj &&
            typeof obj === 'object' &&
            'message' in obj &&
            (typeof obj.message === 'string' || this.isPluralRules(obj.message))
        );
    }

    translate(key: string, variables?: TranslationVariables, count?: number): string {
        const path = key.split('.');
        const localeData = this.locales[this.currentLocale];
        
        if (!localeData) {
            console.warn(`Locale not loaded: ${this.currentLocale}`);
            return key;
        }

        let translation = this.getNestedTranslation(localeData.translations, path);

        // Handle translation key objects
        if (translation && this.isTranslationWithMessage(translation)) {
            translation = translation.message;
        }

        // Handle pluralization
        if (typeof count === 'number' && translation && this.isPluralRules(translation)) {
            const pluralForm = localeData.pluralRules.select(count) as PluralRule;
            translation = translation[pluralForm] || translation.other;
        }

        if (!translation || typeof translation !== 'string') {
            // Try fallback locale
            const fallbackData = this.locales[this.fallbackLocale];
            if (fallbackData) {
                translation = this.getNestedTranslation(fallbackData.translations, path);
                if (translation && this.isTranslationWithMessage(translation)) {
                    translation = translation.message;
                }
            }

            if (!translation || typeof translation !== 'string') {
                console.warn(`Translation not found: ${key}`);
                return key;
            }
        }

        // Replace variables
        if (variables) {
            return translation.replace(/\{\{(\w+)\}\}/g, (_, name) => {
                const value = variables[name];
                if (value === undefined) {
                    console.warn(`Variable not provided: ${name}`);
                    return `{{${name}}}`;
                }
                if (value instanceof Date) {
                    return localeData.dateFormat.format(value);
                }
                return String(value);
            });
        }

        return translation;
    }

    formatNumber(value: number): string {
        const localeData = this.locales[this.currentLocale];
        return localeData ? localeData.numberFormat.format(value) : value.toString();
    }

    formatDate(value: Date): string {
        const localeData = this.locales[this.currentLocale];
        return localeData ? localeData.dateFormat.format(value) : value.toLocaleString();
    }

    formatCurrency(value: number): string {
        const localeData = this.locales[this.currentLocale];
        return localeData ? localeData.currencyFormat.format(value) : value.toString();
    }

    getCurrentLocale(): Language {
        return this.currentLocale;
    }

    getSupportedLocales(): LocaleConfig[] {
        return Object.values(SUPPORTED_LOCALES);
    }
}

export const i18nService = new I18nService(); 