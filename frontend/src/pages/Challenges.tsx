import React from 'react';

export const Challenges = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Language Challenges 🎯
                </h1>
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold">
                            🏆 1,250 Points
                        </span>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg">
                        <span className="text-green-600 dark:text-green-300 font-semibold">
                            Level 5
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Progress
                </h2>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                    750 points to next level
                </p>
            </div>

            {/* Active Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                    {
                        title: 'Daily Conversation',
                        description: 'Complete a 30-minute conversation lesson',
                        points: 100,
                        progress: 0,
                        deadline: '24h remaining',
                        difficulty: 'easy'
                    },
                    {
                        title: 'Grammar Master',
                        description: 'Complete 5 grammar exercises without mistakes',
                        points: 200,
                        progress: 3,
                        deadline: '3d remaining',
                        difficulty: 'medium'
                    },
                    {
                        title: 'Cultural Explorer',
                        description: 'Learn about 3 cultural traditions',
                        points: 150,
                        progress: 2,
                        deadline: '2d remaining',
                        difficulty: 'easy'
                    }
                ].map((challenge, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <div className={`h-2 ${
                            challenge.difficulty === 'easy' ? 'bg-green-500' :
                            challenge.difficulty === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {challenge.title}
                                </h3>
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 
                                               px-2 py-1 rounded text-sm">
                                    {challenge.points} pts
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {challenge.description}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                    <span>Progress: {challenge.progress}/5</span>
                                    <span>{challenge.deadline}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(challenge.progress / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Recent Achievements
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: 'First Lesson', icon: '🎓', date: 'Jan 15' },
                        { name: 'Perfect Week', icon: '🌟', date: 'Jan 20' },
                        { name: 'Quick Learner', icon: '⚡', date: 'Jan 22' },
                        { name: 'Social Butterfly', icon: '🦋', date: 'Jan 25' },
                    ].map((achievement, i) => (
                        <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-3xl mb-2 block">{achievement.icon}</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {achievement.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {achievement.date}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Challenges; 