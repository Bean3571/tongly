import React from 'react';
import { useTranslation } from '../contexts/I18nContext';

interface WithTranslationProps {
    t: (key: string, variables?: any, count?: number) => string;
    formatNumber: (value: number) => string;
    formatDate: (value: Date) => string;
    formatCurrency: (value: number) => string;
}

export function withTranslation<P extends WithTranslationProps>(
    WrappedComponent: React.ComponentType<P>
): React.FC<Omit<P, keyof WithTranslationProps>> {
    return function WithTranslationComponent(props: Omit<P, keyof WithTranslationProps>) {
        const { t, formatNumber, formatDate, formatCurrency } = useTranslation();

        return (
            <WrappedComponent
                {...(props as P)}
                t={t}
                formatNumber={formatNumber}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
            />
        );
    };
} 