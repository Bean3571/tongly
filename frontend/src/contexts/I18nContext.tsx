import React, { createContext, useContext, useState } from 'react';
import enTranslations from '../locales/en.json';
import ruTranslations from '../locales/ru.json';
import esTranslations from '../locales/es.json';

type TranslationVariables = { [key: string]: string | number };

interface I18nContextType {
    t: (key: string, variables?: TranslationVariables, count?: number) => string;
    formatNumber: (value: number) => string;
    formatDate: (value: Date) => string;
    formatCurrency: (value: number) => string;
    currentLanguage: string;
    changeLanguage: (lang: string) => void;
}

const translations: { [key: string]: any } = {
    en: enTranslations,
    ru: ruTranslations,
    es: esTranslations,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState('en');

    const t = (key: string, variables?: TranslationVariables, count?: number): string => {
        const keys = key.split('.');
        let value = translations[currentLanguage];
        
        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value !== 'string') {
            return key;
        }

        if (variables) {
            return value.replace(/\{\{(\w+)\}\}/g, (_, key) => 
                String(variables[key] ?? `{{${key}}}`)
            );
        }

        return value;
    };

    const formatNumber = (value: number): string => {
        return new Intl.NumberFormat(currentLanguage).format(value);
    };

    const formatDate = (value: Date): string => {
        return new Intl.DateTimeFormat(currentLanguage).format(value);
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat(currentLanguage, {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const changeLanguage = (lang: string): void => {
        if (translations[lang]) {
            setCurrentLanguage(lang);
        }
    };

    return (
        <I18nContext.Provider value={{
            t,
            formatNumber,
            formatDate,
            formatCurrency,
            currentLanguage,
            changeLanguage,
        }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
}; 