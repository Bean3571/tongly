export type Language = 'en' | 'ru';

export interface LocaleConfig {
    code: Language;
    name: string;
    nativeName: string;
    flag: string;
    rtl?: boolean;
}

export interface PluralRules {
    zero?: string;
    one: string;
    few?: string;
    many?: string;
    other: string;
}

export interface TranslationVariables {
    [key: string]: string | number | boolean | Date;
}

export interface TranslationKey {
    message: string | PluralRules;
    description?: string;
}

export interface Translations {
    [key: string]: string | PluralRules | TranslationKey | Translations;
}

export interface LocaleData {
    locale: Language;
    translations: Translations;
    pluralRules: Intl.PluralRules;
    numberFormat: Intl.NumberFormat;
    dateFormat: Intl.DateTimeFormat;
    currencyFormat: Intl.NumberFormat;
}

export interface I18nState {
    currentLocale: Language;
    fallbackLocale: Language;
    locales: Record<Language, LocaleData>;
    loading: boolean;
    error: string | null;
}

export interface I18nContextType extends I18nState {
    setLocale: (locale: Language) => Promise<void>;
    t: (key: string, variables?: TranslationVariables, count?: number) => string;
    formatNumber: (value: number) => string;
    formatDate: (value: Date) => string;
    formatCurrency: (value: number) => string;
} 