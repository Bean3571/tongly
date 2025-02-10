import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const DEFAULT_AVATAR = 'https://secure.gravatar.com/avatar/default?s=200&d=mp';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const location = useLocation();

    const getNavLinks = () => {
        if (!user) return [];

        const commonLinks = [
            { to: '/lessons', label: 'My Lessons' },
            { to: '/wallet', label: 'Wallet' }
        ];

        if (user.credentials.role === 'student') {
            return [
                { to: '/student/dashboard', label: 'Dashboard' },
                { to: '/tutors', label: 'Find Tutors' },
                ...commonLinks
            ];
        }

        if (user.credentials.role === 'tutor') {
            return [
                { to: '/tutor/dashboard', label: 'Dashboard' },
                ...commonLinks
            ];
        }

        return commonLinks;
    };

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            Tongly
                        </Link>
                        
                        <div className="hidden md:flex ml-10 space-x-8">
                            {getNavLinks().map(link => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors
                                              ${isActive(link.to) ? 'text-blue-600 dark:text-blue-400 font-medium' : ''}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                                {user.credentials?.role === 'tutor' ? (
                                    <span className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Earnings:</span> $250.00
                                    </span>
                                ) : (
                                    <Link
                                        to="/wallet"
                                        className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <span className="font-medium">Balance:</span> $250.00
                                    </Link>
                                )}
                                <div className="relative group">
                                    <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <img
                                            src={user.personal?.profile_picture || DEFAULT_AVATAR}
                                            alt={user.credentials?.username}
                                            className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = DEFAULT_AVATAR;
                                            }}
                                        />
                                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                                            {user.credentials?.username}
                                        </span>
                                    </button>
                                    <div className="absolute right-0 w-48 mt-2 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <Link
                                            to="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                                        >
                                            Profile Settings
                                        </Link>
                                        <button
                                            onClick={logout}
                                            className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
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
                                    className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
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