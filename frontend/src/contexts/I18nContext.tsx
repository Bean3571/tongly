import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18nService, SUPPORTED_LOCALES } from '../services/i18n/i18nService';
import { I18nContextType, Language, TranslationVariables } from '../services/i18n/types';

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
    children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    const [currentLocale, setCurrentLocale] = useState<Language>(i18nService.getCurrentLocale());
    const [error, setError] = useState<string | null>(null);

    const handleSetLocale = async (locale: Language) => {
        try {
            setError(null);
            await i18nService.setLocale(locale);
            setCurrentLocale(locale);
            // Update document attributes
            document.documentElement.lang = locale;
            document.documentElement.dir = SUPPORTED_LOCALES[locale].rtl ? 'rtl' : 'ltr';
            // Store preference
            localStorage.setItem('locale', locale);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set locale');
            console.error('Failed to set locale:', err);
        }
    };

    const value: I18nContextType = {
        currentLocale,
        fallbackLocale: 'en',
        locales: i18nService['locales'],
        loading: false,
        error,
        setLocale: handleSetLocale,
        t: (key: string, variables?: TranslationVariables, count?: number) => 
            i18nService.translate(key, variables, count),
        formatNumber: (value: number) => i18nService.formatNumber(value),
        formatDate: (value: Date) => i18nService.formatDate(value),
        formatCurrency: (value: number) => i18nService.formatCurrency(value),
    };

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};

export const useTranslation = () => {
    const { t, formatNumber, formatDate, formatCurrency } = useI18n();
    return { t, formatNumber, formatDate, formatCurrency };
}; 