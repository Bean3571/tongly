import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

export const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            Tongly👅
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
                            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 
                                     dark:hover:text-gray-200 transition-colors"
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center space-x-2 focus:outline-none"
                                >
                                    <img
                                        src={user.profile_picture || '/default-avatar.svg'}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 
                                                 dark:border-gray-700 hover:border-blue-500 
                                                 dark:hover:border-blue-400 transition-colors"
                                    />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 
                                                    rounded-md shadow-lg py-1 z-50 border border-gray-200 
                                                    dark:border-gray-700">
                                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.first_name || user.username}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 
                                                     hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                logout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 
                                                     dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="text-gray-700 dark:text-gray-300 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                             transition-colors"
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

export default Navbar; 