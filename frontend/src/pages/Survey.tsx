import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

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

export const Survey = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        nativeLanguage: '',
        learningLanguage: '',
        languageLevel: '',
        learningGoals: [] as string[],
        interests: [] as string[]
    });

    const handleNext = () => {
        if (step < 5) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        try {
            await api.user.updateProfile({
                native_language: formData.nativeLanguage,
                languages: [{
                    language: formData.learningLanguage,
                    level: formData.languageLevel
                }],
                interests: formData.interests,
                learning_goals: formData.learningGoals,
                survey_complete: true
            });
            await refreshUser();
            showNotification('success', 'Survey completed successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification('error', 'Failed to save survey. Please try again.');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">What's your native language?</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(languageEmojis).map(([lang, flag]) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setFormData({ ...formData, nativeLanguage: lang });
                                        handleNext();
                                    }}
                                    className={`p-3 rounded-lg border ${
                                        formData.nativeLanguage === lang
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                            : 'border-gray-200 dark:border-gray-700'
                                    } hover:border-blue-500 dark:hover:border-blue-400`}
                                >
                                    <span className="text-2xl mr-2">{flag}</span>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Which language do you want to learn?</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(languageEmojis).map(([lang, flag]) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setFormData({ ...formData, learningLanguage: lang });
                                        handleNext();
                                    }}
                                    className={`p-3 rounded-lg border ${
                                        formData.learningLanguage === lang
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                            : 'border-gray-200 dark:border-gray-700'
                                    } hover:border-blue-500 dark:hover:border-blue-400`}
                                >
                                    <span className="text-2xl mr-2">{flag}</span>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">What's your current level?</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {languageLevels.map((level) => (
                                <button
                                    key={level}
                                    onClick={() => {
                                        setFormData({ ...formData, languageLevel: level });
                                        handleNext();
                                    }}
                                    className={`p-3 rounded-lg border ${
                                        formData.languageLevel === level
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                            : 'border-gray-200 dark:border-gray-700'
                                    } hover:border-blue-500 dark:hover:border-blue-400`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">What are your learning goals?</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(goalEmojis).map(([goal, label]) => (
                                <button
                                    key={goal}
                                    onClick={() => {
                                        const goals = formData.learningGoals.includes(goal)
                                            ? formData.learningGoals.filter(g => g !== goal)
                                            : [...formData.learningGoals, goal];
                                        setFormData({ ...formData, learningGoals: goals });
                                    }}
                                    className={`p-3 rounded-lg border ${
                                        formData.learningGoals.includes(goal)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                            : 'border-gray-200 dark:border-gray-700'
                                    } hover:border-blue-500 dark:hover:border-blue-400 text-left`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        {formData.learningGoals.length > 0 && (
                            <button
                                onClick={handleNext}
                                className="mt-4 w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                            >
                                Next
                            </button>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">What are your interests?</h2>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(interestEmojis).map(([interest, emoji]) => (
                                <button
                                    key={interest}
                                    onClick={() => {
                                        const interests = formData.interests.includes(interest)
                                            ? formData.interests.filter(i => i !== interest)
                                            : [...formData.interests, interest];
                                        setFormData({ ...formData, interests: interests });
                                    }}
                                    className={`p-3 rounded-lg border ${
                                        formData.interests.includes(interest)
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                            : 'border-gray-200 dark:border-gray-700'
                                    } hover:border-blue-500 dark:hover:border-blue-400`}
                                >
                                    <span className="text-2xl mr-2">{emoji}</span>
                                    {interest.charAt(0).toUpperCase() + interest.slice(1)}
                                </button>
                            ))}
                        </div>
                        {formData.interests.length > 0 && (
                            <button
                                onClick={handleSubmit}
                                className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700"
                            >
                                Complete Survey
                            </button>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
                    Let's personalize your experience
                </h2>
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {renderStep()}
                    {step > 1 && step < 5 && (
                        <button
                            onClick={handleBack}
                            className="mt-4 w-full bg-gray-600 text-white p-3 rounded-lg hover:bg-gray-700"
                        >
                            Back
                        </button>
                    )}
                </div>
                <div className="mt-4 flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            className={`w-3 h-3 rounded-full ${
                                s === step ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                            }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Survey; 