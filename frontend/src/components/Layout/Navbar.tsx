import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            Tongly
                        </Link>
                        
                        {user && (
                            <div className="hidden md:flex ml-10 space-x-8">
                                <Link
                                    to="/dashboard"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/tutors"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Find Tutors
                                </Link>
                                <Link
                                    to="/lessons"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    My Lessons
                                </Link>
                                <Link
                                    to="/challenges"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Challenges
                                </Link>
                                <Link
                                    to="/leaderboard"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Leaderboard
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 
                                     hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDarkMode ? (
                                <FaSun className="w-5 h-5" />
                            ) : (
                                <FaMoon className="w-5 h-5" />
                            )}
                        </button>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/wallet"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    <span className="font-medium">$250.00</span>
                                </Link>
                                <div className="relative group">
                                    <button className="flex items-center space-x-2">
                                        <img
                                            className="h-8 w-8 rounded-full"
                                            src={user.profile_picture || 'https://via.placeholder.com/32'}
                                            alt={user.username}
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://via.placeholder.com/32';
                                            }}
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {user.username}
                                        </span>
                                    </button>
                                    <div className="absolute right-0 w-48 mt-2 py-2 bg-white dark:bg-gray-800 
                                                  rounded-md shadow-xl opacity-0 invisible group-hover:opacity-100 
                                                  group-hover:visible transition-all duration-300">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                                                     hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 
                                                     hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 
                                             dark:hover:text-blue-300 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 
                                             dark:hover:bg-blue-600 text-white rounded-md font-medium transition-colors"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}; 