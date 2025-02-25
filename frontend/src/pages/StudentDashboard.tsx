import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../api/client';
import type { LanguageLevel, User } from '../types';

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

const StudentDashboard: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [isEditingLanguages, setIsEditingLanguages] = useState(false);
    const [isEditingGoals, setIsEditingGoals] = useState(false);
    const [isEditingInterests, setIsEditingInterests] = useState(false);
    const [editedLanguages, setEditedLanguages] = useState<LanguageLevel[]>([]);
    const [editedGoals, setEditedGoals] = useState<string[]>(user?.student?.learning_goals || []);
    const [editedInterests, setEditedInterests] = useState<string[]>(user?.student?.interests || []);

    useEffect(() => {
        if (user?.student?.learning_languages) {
            setEditedLanguages(user.student.learning_languages);
        }
    }, [user?.student?.learning_languages]);

    const handleLanguagesSubmit = async () => {
        try {
            await api.user.updateProfile({  
                languages: editedLanguages, 
                interests: user?.student?.interests || [],
                learning_goals: user?.student?.learning_goals || [],
                first_name: user?.personal?.first_name || null,
                last_name: user?.personal?.last_name || null,
                profile_picture: user?.personal?.profile_picture || null,
                age: user?.personal?.age || null,
                sex: user?.personal?.sex || null
            });
            await refreshUser();
            setIsEditingLanguages(false);   
        } catch (error) {
            console.error('Failed to update languages:', error);
            showNotification('error', 'Failed to update languages');
        }
    };

    const handleGoalsSubmit = async () => {
        try {
            await api.user.updateProfile({ 
                learning_goals: editedGoals,
                languages: user?.student?.learning_languages || [],
                interests: user?.student?.interests || [],
                first_name: user?.personal?.first_name || null,
                last_name: user?.personal?.last_name || null,
                profile_picture: user?.personal?.profile_picture || null,
                age: user?.personal?.age || null,
                sex: user?.personal?.sex || null,
            });
            await refreshUser();
            setIsEditingGoals(false);      
        } catch (error) {
            console.error('Failed to update goals:', error);
            showNotification('error', 'Failed to update learning goals');
        }
    };

    const handleInterestsSubmit = async () => {
        try {
            await api.user.updateProfile({ 
                interests: editedInterests,
                languages: user?.student?.learning_languages || [],
                learning_goals: user?.student?.learning_goals || [],
                first_name: user?.personal?.first_name || null,
                last_name: user?.personal?.last_name || null,
                profile_picture: user?.personal?.profile_picture || null,
                age: user?.personal?.age || null,
                sex: user?.personal?.sex || null,
            });
            await refreshUser();
            setIsEditingInterests(false);  
        } catch (error) {
            console.error('Failed to update interests:', error);
            showNotification('error', 'Failed to update interests');
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Welcome back, {user?.personal?.first_name || user?.credentials?.username}! 
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Learning Languages Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Languages 🌍
                        </h2>
                        <button
                            onClick={() => setIsEditingLanguages(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            Edit
                        </button>
                    </div>
                    <div className="space-y-2">
                        {user?.student?.learning_languages?.map((lang, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {lang.language}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                    {lang.level}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Learning Goals */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Your Goals 🎯
                        </h2>
                        <button
                            onClick={() => setIsEditingGoals(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            Edit
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
                                onClick={handleGoalsSubmit}
                                className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 
                                         transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(user.student?.learning_goals || []).map((goal: string) => (
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
                            onClick={() => setIsEditingInterests(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                            Edit
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
                                onClick={handleInterestsSubmit}
                                className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 
                                         transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(user.student?.interests || []).map((interest: string) => (
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

export default StudentDashboard;