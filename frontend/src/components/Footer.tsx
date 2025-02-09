import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Footer = () => {
    const { user } = useAuth();

    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Tongly
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Connect with native speakers and learn languages naturally.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/tutors"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Find Tutors
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/lessons"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Book a Lesson
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/challenges"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Language Challenges
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/leaderboard"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Leaderboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Support
                        </h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    to="/help"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/faq"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contact"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                             dark:hover:text-blue-400 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Social Media */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Connect With Us
                        </h3>
                        <div className="flex space-x-4">
                            <a
                                href="https://twitter.com/tongly"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                         dark:hover:text-blue-400 transition-colors"
                            >
                                Twitter
                            </a>
                            <a
                                href="https://facebook.com/tongly"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                         dark:hover:text-blue-400 transition-colors"
                            >
                                Facebook
                            </a>
                            <a
                                href="https://instagram.com/tongly"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 
                                         dark:hover:text-blue-400 transition-colors"
                            >
                                Instagram
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-gray-600 dark:text-gray-400">
                        © {new Date().getFullYear()} Tongly. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}; 