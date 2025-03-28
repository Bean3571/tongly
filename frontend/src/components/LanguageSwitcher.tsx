import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { SUPPORTED_LOCALES } from '../services/i18n/i18nService';
import { Language } from '../services/i18n/types';

export const LanguageSwitcher: React.FC = () => {
    const { currentLanguage, changeLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent, locale: Language) => {
        switch (event.key) {
            case ' ':
            case 'Enter':
                event.preventDefault();
                changeLanguage(locale);
                setIsOpen(false);
                break;
            case 'Escape':
                setIsOpen(false);
                break;
            case 'ArrowDown':
                event.preventDefault();
                const next = event.currentTarget.nextElementSibling;
                if (next instanceof HTMLElement) {
                    next.focus();
                }
                break;
            case 'ArrowUp':
                event.preventDefault();
                const prev = event.currentTarget.previousElementSibling;
                if (prev instanceof HTMLElement) {
                    prev.focus();
                }
                break;
        }
    };

    const currentLocaleConfig = SUPPORTED_LOCALES[currentLanguage as Language];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label="Select language"
            >
                <span className="text-xl" aria-hidden="true">{currentLocaleConfig.flag}</span>
                <span className="hidden sm:inline">{currentLocaleConfig.name}</span>
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    role="listbox"
                    aria-label="Languages"
                >
                    {Object.entries(SUPPORTED_LOCALES).map(([code, locale]) => (
                        <div
                            key={code}
                            className={`flex items-center px-4 py-2 text-sm cursor-pointer
                                ${currentLanguage === code
                                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            role="option"
                            aria-selected={currentLanguage === code}
                            tabIndex={0}
                            onClick={() => {
                                changeLanguage(code as Language);
                                setIsOpen(false);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, code as Language)}
                        >
                            <span className="text-xl mr-3" aria-hidden="true">
                                {locale.flag}
                            </span>
                            <div>
                                <div>{locale.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {locale.nativeName}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}; 