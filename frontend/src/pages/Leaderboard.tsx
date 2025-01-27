import React from 'react';

export const Leaderboard = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Leaderboard 🏆
            </h1>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-wrap gap-4">
                    <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="global">Global</option>
                        <option value="friends">Friends</option>
                        <option value="country">Country</option>
                    </select>
                    <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Languages</option>
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                    </select>
                    <select className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="alltime">All Time</option>
                    </select>
                </div>
            </div>

            {/* Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Second Place */}
                <div className="order-2 md:order-1">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                        <div className="text-4xl mb-4">🥈</div>
                        <img
                            src="https://via.placeholder.com/80"
                            alt="Second Place"
                            className="w-20 h-20 rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Sarah Chen
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                            2,850 pts
                        </p>
                    </div>
                </div>

                {/* First Place */}
                <div className="order-1 md:order-2">
                    <div className="bg-gradient-to-b from-yellow-100 to-yellow-50 dark:from-yellow-900 dark:to-gray-800 
                                  rounded-lg shadow-lg p-6 text-center transform md:-translate-y-4">
                        <div className="text-4xl mb-4">👑</div>
                        <img
                            src="https://via.placeholder.com/100"
                            alt="First Place"
                            className="w-24 h-24 rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            John Smith
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-3xl">
                            3,120 pts
                        </p>
                    </div>
                </div>

                {/* Third Place */}
                <div className="order-3">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
                        <div className="text-4xl mb-4">🥉</div>
                        <img
                            src="https://via.placeholder.com/80"
                            alt="Third Place"
                            className="w-20 h-20 rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Maria Garcia
                        </h3>
                        <p className="text-blue-600 dark:text-blue-400 font-bold text-2xl">
                            2,540 pts
                        </p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                {[4, 5, 6, 7, 8, 9, 10].map((position) => (
                    <div key={position} className="flex items-center p-4 border-b dark:border-gray-700 last:border-0 
                                                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <span className="w-12 text-xl font-bold text-gray-500 dark:text-gray-400">
                            {position}
                        </span>
                        <img
                            src={`https://via.placeholder.com/40`}
                            alt={`Position ${position}`}
                            className="w-10 h-10 rounded-full mr-4"
                        />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                User Name {position}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                {3000 - position * 100} points • Level {Math.floor((3000 - position * 100) / 500)}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                                {position === 4 ? '↑ 1' : position === 5 ? '↓ 2' : '-'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Leaderboard;