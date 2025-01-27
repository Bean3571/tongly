import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { LanguageLevel, LearningGoal, User } from '../types';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Welcome back, {user.first_name || user.username}! 👋
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Language Learning Progress */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Your Language Progress 📚
                    </h2>
                    {(user.languages || []).map((lang: LanguageLevel) => (
                        <div key={lang.language} className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700 dark:text-gray-300">
                                    {lang.language} - Level {lang.level}
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

                {/* Learning Goals */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Your Goals 🎯
                    </h2>
                    <div className="space-y-3">
                        {(user.learning_goals || []).map((goal: string) => (
                            <div
                                key={goal}
                                className="flex items-center text-gray-700 dark:text-gray-300"
                            >
                                <span className="mr-2">•</span>
                                <span className="capitalize">{goal}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Interests */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Your Interests 💡
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {(user.interests || []).map((interest: string) => (
                            <span
                                key={interest}
                                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full 
                                         text-sm text-gray-700 dark:text-gray-300 capitalize"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;