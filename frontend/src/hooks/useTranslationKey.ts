import { useMemo } from 'react';
import { useTranslation } from '../contexts/I18nContext';

export function useTranslationKey(prefix: string) {
    const { t } = useTranslation();

    return useMemo(() => {
        return {
            translate: (key: string, variables?: any, count?: number) => 
                t(`${prefix}.${key}`, variables, count),
            translatePath: (path: string, variables?: any, count?: number) => 
                t(path.startsWith(prefix) ? path : `${prefix}.${path}`, variables, count),
            getKey: (key: string) => `${prefix}.${key}`,
            prefix,
        };
    }, [prefix, t]);
} 