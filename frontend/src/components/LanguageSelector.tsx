import React, { useState } from 'react';
import { Language, LanguageLevel, TutorLanguage } from '../types';

const LANGUAGE_LEVELS: LanguageLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];
const COMMON_LANGUAGES = [
    'English',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Chinese',
    'Japanese',
    'Korean',
    'Arabic'
];

interface Props {
    languages: Language[] | TutorLanguage[];
    onChange: (languages: Language[] | TutorLanguage[]) => void;
    isTutorMode?: boolean;
}

export const LanguageSelector: React.FC<Props> = ({ languages, onChange, isTutorMode = false }) => {
    const [newLanguage, setNewLanguage] = useState('');
    const [selectedLevel, setSelectedLevel] = useState<LanguageLevel>("A1");
    const [isNative, setIsNative] = useState(false);
    const [canTeach, setCanTeach] = useState(false);
    const [showLanguageInput, setShowLanguageInput] = useState(false);

    const handleAddLanguage = (language: string) => {
        if (!language) return;

        if (languages.some(l => l.language.toLowerCase() === language.toLowerCase())) {
            return; // Language already exists
        }

        const newLanguageEntry = isTutorMode ? {
            language,
            level: selectedLevel,
            is_native: isNative,
            can_teach: canTeach
        } as TutorLanguage : {
            language,
            level: selectedLevel
        } as Language;

        onChange([...languages, newLanguageEntry]);
    };

    const handleRemoveLanguage = (language: string) => {
        onChange(languages.filter(l => l.language !== language));
    };

    const handleSelectCommonLanguage = (language: string) => {
        setNewLanguage(language);
        setShowLanguageInput(true);
    };

    return (
        <div className="space-y-4">
            {languages.map((lang) => (
                <div
                    key={lang.language}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                    <div>
                        <div className="font-medium">{lang.language}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Level: {lang.level}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleRemoveLanguage(lang.language)}
                        className="text-red-600 hover:text-red-800"
                    >
                        Remove
                    </button>
                </div>
            ))}

            {!showLanguageInput ? (
                <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Common Languages
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {COMMON_LANGUAGES.map(lang => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => handleSelectCommonLanguage(lang)}
                                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-full 
                                         hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                {lang}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setShowLanguageInput(true)}
                            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 
                                     dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
                        >
                            + Other Language
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Language
                        </label>
                        <input
                            type="text"
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                     focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 
                                     dark:border-gray-600"
                            placeholder="Enter language name"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Proficiency Level
                            </label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value as LanguageLevel)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                         focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 
                                         dark:border-gray-600"
                            >
                                {LANGUAGE_LEVELS.map(level => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <div className="space-y-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isNative}
                                        onChange={(e) => setIsNative(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm 
                                                 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        This is my native language
                                    </span>
                                </label>

                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={canTeach}
                                        onChange={(e) => setCanTeach(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm 
                                                 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        I can teach this language
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={() => {
                                handleAddLanguage(newLanguage);
                                setShowLanguageInput(false);
                                setNewLanguage('');
                                setSelectedLevel("A1");
                                setIsNative(false);
                                setCanTeach(false);
                            }}
                            disabled={!newLanguage.trim()}
                            className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm 
                                     text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Add Language
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowLanguageInput(false);
                                setNewLanguage('');
                                setSelectedLevel("A1");
                                setIsNative(false);
                                setCanTeach(false);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm 
                                     font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none 
                                     focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 
                                     dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector; 