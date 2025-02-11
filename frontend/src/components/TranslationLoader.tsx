import React, { useEffect, useState, ReactNode } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { Language } from '../services/i18n/types';
import enTranslations from '../locales/en.json';
import ruTranslations from '../locales/ru.json';

const translations = {
    en: enTranslations,
    ru: ruTranslations
};

interface TranslationLoaderProps {
    children: ReactNode;
    fallback?: ReactNode;
    locales?: Language[];
}

export const TranslationLoader = ({
    children,
    fallback = null,
    locales = ['ru', 'en'],
}: TranslationLoaderProps): JSX.Element => {
    const { currentLocale, loading, error } = useI18n();
    const [loadingLocales, setLoadingLocales] = useState<boolean>(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    useEffect(() => {
        const loadLocales = async () => {
            try {
                setLoadingLocales(true);
                setLoadingError(null);

                // Load translations synchronously since they're now statically imported
                locales.forEach((locale) => {
                    if (!translations[locale]) {
                        throw new Error(`Translation not found for locale: ${locale}`);
                    }
                });
            } catch (err) {
                setLoadingError(err instanceof Error ? err.message : 'Failed to load translations');
                console.error('Failed to load translations:', err);
            } finally {
                setLoadingLocales(false);
            }
        };

        loadLocales();
    }, [locales]);

    if (loading || loadingLocales) {
        return fallback as JSX.Element || (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600 dark:text-gray-400">
                    Loading translations...
                </div>
            </div>
        );
    }

    if (error || loadingError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600 dark:text-red-400">
                    {error || loadingError}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}; 