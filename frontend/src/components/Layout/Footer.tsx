import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const Footer = () => {
    const { user } = useAuth();
    
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Tongly
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Connect with native speakers and learn languages naturally.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}; 