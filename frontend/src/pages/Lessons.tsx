import React from 'react';

export const Lessons = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                My Lessons 📚
            </h1>

            {/* Upcoming Lessons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Upcoming Lessons
                </h2>
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="flex flex-col md:flex-row items-center justify-between 
                                              border-b dark:border-gray-700 last:border-0 pb-4">
                            <div className="flex items-center mb-4 md:mb-0">
                                <img
                                    src={`https://via.placeholder.com/48`}
                                    alt="Tutor"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        English Conversation with Sarah
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Tomorrow, 10:00 AM • 60 minutes
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                                 transition-colors">
                                    Join Lesson
                                </button>
                                <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg 
                                                 hover:bg-red-50 dark:hover:bg-red-900 transition-colors">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Past Lessons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Past Lessons
                </h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex flex-col md:flex-row items-center justify-between 
                                              border-b dark:border-gray-700 last:border-0 pb-4">
                            <div className="flex items-center mb-4 md:mb-0">
                                <img
                                    src={`https://via.placeholder.com/48`}
                                    alt="Tutor"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Spanish Grammar with Miguel
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        January {20 + i}, 2024 • 60 minutes
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2">
                                {i === 1 ? (
                                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg 
                                                     hover:bg-green-700 transition-colors">
                                        Leave Review
                                    </button>
                                ) : (
                                    <div className="flex items-center">
                                        <span className="text-yellow-400 mr-2">⭐⭐⭐⭐⭐</span>
                                        <span className="text-gray-600 dark:text-gray-300">
                                            Great lesson!
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Lessons; 