import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../api/client';
import type { LanguageLevel, Language } from '../types';

const languageEmojis: { [key: string]: string } = {
    'English': '🇬🇧',
    'Spanish': '🇪🇸',
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Chinese': '🇨🇳',
    'Japanese': '🇯🇵',
    'Korean': '🇰🇷',
    'Russian': '🇷🇺',
    'Arabic': '🇸🇦',
    'Portuguese': '🇵🇹',
    'Italian': '🇮🇹'
};

const interestEmojis: { [key: string]: string } = {
    'music': '🎵',
    'movies': '🎬',
    'books': '📚',
    'sports': '⚽',
    'technology': '💻',
    'art': '🎨',
    'cooking': '🍳',
    'travel': '✈️',
    'photography': '📷',
    'gaming': '🎮',
    'nature': '🌿',
    'fashion': '👗',
    'science': '🔬',
    'history': '📜',
    'business': '💼',
    'politics': '🏛️',
    'health': '🏥',
    'education': '🎓'
};

const goalEmojis: { [key: string]: string } = {
    'business': '💼 Business Communication',
    'job': '💻 Job Opportunities',
    'study': '📚 Academic Studies',
    'trip': '✈️ Travel',
    'migration': '🌍 Migration',
    'exams': '📝 Language Exams',
    'culture': '🎭 Cultural Understanding',
    'friends': '👥 Making Friends',
    'hobby': '🎯 Personal Interest'
};

const languageLevels = [
    'Beginner (A1)',
    'Elementary (A2)',
    'Intermediate (B1)',
    'Upper Intermediate (B2)',
    'Advanced (C1)',
    'Mastery (C2)'
];

const Dashboard: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [isEditingLanguages, setIsEditingLanguages] = useState(false);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [isEditingInterests, setIsEditingInterests] = useState(false);
    const [editedLanguages, setEditedLanguages] = useState<Language[]>(user?.languages || []);
    const [editedGoals, setEditedGoals] = useState<string[]>(user?.learning_goals || []);
    const [editedInterests, setEditedInterests] = useState<string[]>(user?.interests || []);

    if (!user) {
        return null;
    }

    const handleSaveLanguages = async () => {
        try {
            await api.user.updateProfile({
                ...user,
                languages: editedLanguages,
            });
            await refreshUser();
            setIsEditingLanguages(false);
            showNotification('success', 'Languages updated successfully');
        } catch (error) {
            showNotification('error', 'Failed to update languages');
        }
    };

    const handleSaveGoals = async () => {
        try {
            await api.user.updateProfile({
                ...user,
                learning_goals: editedGoals,
            });
            await refreshUser();
            setIsEditingGoals(false);
            showNotification('success', 'Learning goals updated successfully!');
        } catch (error) {
            console.error('Failed to update goals:', error);
            showNotification('error', 'Failed to update goals. Please try again.');
        }
    };

    const handleSaveInterests = async () => {
        try {
            await api.user.updateProfile({
                ...user,
                interests: editedInterests,
            });
            await refreshUser();
            setIsEditingInterests(false);
            showNotification('success', 'Interests updated successfully!');
        } catch (error) {
            console.error('Failed to update interests:', error);
            showNotification('error', 'Failed to update interests. Please try again.');
        }
    };

<<<<<<< Updated upstream
    const getAvailableLanguages = () => {
        return Object.keys(languageEmojis).filter(
            lang => !editedLanguages.some(existing => existing.language === lang)
        );
    };

    const addLanguage = () => {
        const availableLanguages = getAvailableLanguages();
        if (availableLanguages.length === 0) {
            showNotification('error', 'You have already added all available languages.');
            return;
        }

        setEditedLanguages([
            ...editedLanguages,
            { language: availableLanguages[0], level: 'A1' }
        ]);
    };

    const handleLanguageLevelChange = (index: number, lang: Language, value: string) => {
        const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;
        if (!validLevels.includes(value as any)) {
            showNotification('error', 'Invalid language level selected');
            return;
        }
        const newLanguages = [...editedLanguages];
        newLanguages[index] = { ...lang, level: value as Language['level'] };
        setEditedLanguages(newLanguages);
    };

=======
>>>>>>> Stashed changes
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Welcome back, {user.first_name || user.username}! 👋
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Language Learning Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Language Progress 📚
                        </h2>
                        <button
                            onClick={() => setIsEditingLanguages(!isEditingLanguages)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {isEditingLanguages ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {isEditingLanguages ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                {editedLanguages.map((lang, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <select
                                            value={lang.language}
                                            onChange={(e) => {
                                                const newLanguages = [...editedLanguages];
                                                newLanguages[index] = { ...lang, language: e.target.value };
                                                setEditedLanguages(newLanguages);
                                            }}
                                            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                     dark:bg-gray-700 dark:text-white"
                                        >
                                            {Object.keys(languageEmojis).map((language) => (
                                                <option key={language} value={language}>
                                                    {languageEmojis[language]} {language}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            value={lang.level}
                                            onChange={(e) => {
                                                const newLanguages = [...editedLanguages];
                                                newLanguages[index] = { ...lang, level: e.target.value as LanguageLevel };
                                                setEditedLanguages(newLanguages);
                                            }}
                                            className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                     dark:bg-gray-700 dark:text-white"
                                        >
                                            {languageLevels.map((level) => (
                                                <option key={level} value={level}>
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                const newLanguages = editedLanguages.filter((_, i) => i !== index);
                                                setEditedLanguages(newLanguages);
                                            }}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
<<<<<<< Updated upstream
                                onClick={addLanguage}
=======
                                onClick={() => setEditedLanguages([...editedLanguages, { language: 'English', level: 'Beginner (A1)' }])}
>>>>>>> Stashed changes
                                className="w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 
                                         rounded-lg text-gray-600 dark:text-gray-300 hover:border-blue-500 
                                         hover:text-blue-500 transition-colors"
                            >
                                + Add Language
                            </button>
                            <button
                                onClick={handleSaveLanguages}
                                className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 
                                         transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {(user.languages || []).map((lang: Language) => (
                                <div key={lang.language} className="mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {languageEmojis[lang.language]} {lang.language} - {lang.level}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{ width: '25%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Learning Goals */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Goals 🎯
                        </h2>
                        <button
                            onClick={() => setIsEditingGoals(!isEditingGoals)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {isEditingGoals ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {isEditingGoals ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(goalEmojis).map(([goal, label]) => (
                                    <button
                                        key={goal}
                                        onClick={() => {
                                            const newGoals = editedGoals.includes(goal)
                                                ? editedGoals.filter(g => g !== goal)
                                                : [...editedGoals, goal];
                                            setEditedGoals(newGoals);
                                        }}
                                        className={`p-3 rounded-lg border text-left ${
                                            editedGoals.includes(goal)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                : 'border-gray-200 dark:border-gray-700'
                                        } hover:border-blue-500 dark:hover:border-blue-400`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveGoals}
                                className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 
                                         transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(user.learning_goals || []).map((goal: string) => (
                                <div
                                    key={goal}
                                    className="flex items-center text-gray-700 dark:text-gray-300"
                                >
                                    <span className="mr-2">{goalEmojis[goal]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Interests */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Interests 💡
                        </h2>
                        <button
                            onClick={() => setIsEditingInterests(!isEditingInterests)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            {isEditingInterests ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                    {isEditingInterests ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(interestEmojis).map(([interest, emoji]) => (
                                    <button
                                        key={interest}
                                        onClick={() => {
                                            const newInterests = editedInterests.includes(interest)
                                                ? editedInterests.filter(i => i !== interest)
                                                : [...editedInterests, interest];
                                            setEditedInterests(newInterests);
                                        }}
                                        className={`p-3 rounded-lg border ${
                                            editedInterests.includes(interest)
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                : 'border-gray-200 dark:border-gray-700'
                                        } hover:border-blue-500 dark:hover:border-blue-400`}
                                    >
                                        <span className="text-2xl mr-2">{emoji}</span>
                                        {interest.charAt(0).toUpperCase() + interest.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleSaveInterests}
                                className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 
                                         transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(user.interests || []).map((interest: string) => (
                                <span
                                    key={interest}
                                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full 
                                             text-sm text-gray-700 dark:text-gray-300 capitalize"
                                >
                                    {interestEmojis[interest]} {interest}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;