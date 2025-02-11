import React, { createContext, useContext, useState, useEffect } from 'react';
import { i18nService, SUPPORTED_LOCALES } from '../services/i18n/i18nService';
import { I18nContextType, Language, TranslationVariables } from '../services/i18n/types';

const I18nContext = createContext<I18nContextType | null>(null);

interface I18nProviderProps {
    children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    const [currentLocale, setCurrentLocale] = useState<Language>(i18nService.getCurrentLocale());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load initial locale
    useEffect(() => {
        const initializeLocale = async () => {
            try {
                setLoading(true);
                setError(null);
                await i18nService.loadLocale(currentLocale);
                // Also load English as fallback
                if (currentLocale !== 'en') {
                    await i18nService.loadLocale('en');
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load translations');
                console.error('Failed to initialize locale:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeLocale();
    }, []);

    // Handle locale changes
    useEffect(() => {
        const changeLocale = async () => {
            try {
                setLoading(true);
                setError(null);
                await i18nService.setLocale(currentLocale);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to set locale');
                console.error('Failed to set locale:', err);
            } finally {
                setLoading(false);
            }
        };

        if (!loading) {
            changeLocale();
        }
    }, [currentLocale]);

    const handleSetLocale = async (locale: Language) => {
        try {
            setLoading(true);
            setError(null);
            await i18nService.setLocale(locale);
            setCurrentLocale(locale);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set locale');
            console.error('Failed to set locale:', err);
        } finally {
            setLoading(false);
        }
    };

    const value: I18nContextType = {
        currentLocale,
        fallbackLocale: 'ru',
        locales: i18nService['locales'],
        loading,
        error,
        setLocale: handleSetLocale,
        t: (key: string, variables?: TranslationVariables, count?: number) => 
            i18nService.translate(key, variables, count),
        formatNumber: (value: number) => i18nService.formatNumber(value),
        formatDate: (value: Date) => i18nService.formatDate(value),
        formatCurrency: (value: number) => i18nService.formatCurrency(value),
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600 dark:text-gray-400">
                    {i18nService.translate('common.loading')}
                </div>
            </div>
        );
    }

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