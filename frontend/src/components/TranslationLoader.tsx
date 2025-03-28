import React, { useEffect, useState, ReactNode } from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { Language } from '../services/i18n/types';
import enTranslations from '../locales/en.json';
import ruTranslations from '../locales/ru.json';
import esTranslations from '../locales/es.json';

const translations = {
    en: enTranslations,
    ru: ruTranslations,
    es: esTranslations
};

interface TranslationLoaderProps {
    children: ReactNode;
    fallback?: ReactNode;
    locales?: Language[];
}

export const TranslationLoader = ({
    children,
    fallback = null,
    locales = ['en', 'ru', 'es'],
}: TranslationLoaderProps): JSX.Element => {
    const { currentLanguage } = useTranslation();
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

    if (loadingLocales) {
        return fallback as JSX.Element || (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-gray-600">
                    Loading translations...
                </div>
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-red-600">
                    {loadingError}
                </div>
            </div>
        );
    }

    return <>{children}</>;
}; 