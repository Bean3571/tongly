import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';

export const Home = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                {t('pages.home.welcome')} 🌍
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {t('pages.home.description')}
            </p>

            {!user ? (
                <div className="space-x-4">
                    <Link
                        to="/register"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg 
                                 hover:bg-blue-700 transition-colors font-medium"
                    >
                        {t('pages.home.get.started')}
                    </Link>
                    <Link
                        to="/login"
                        className="inline-block px-6 py-3 text-blue-600 dark:text-blue-400 
                                 border-2 border-blue-600 dark:border-blue-400 rounded-lg 
                                 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors font-medium"
                    >
                        {t('pages.home.sign.in')}
                    </Link>
                </div>
            ) : (
                <Link
                    to="/dashboard"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg 
                             hover:bg-blue-700 transition-colors font-medium"
                >
                    {t('pages.home.go.to.dashboard')}
                </Link>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <span className="text-3xl mb-4 block">👥</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.home.features.native.tutors.title')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        {t('pages.home.features.native.tutors.description')}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <span className="text-3xl mb-4 block">🎯</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.home.features.personalized.learning.title')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        {t('pages.home.features.personalized.learning.description')}
                    </p>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                    <span className="text-3xl mb-4 block">🏆</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {t('pages.home.features.track.progress.title')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                        {t('pages.home.features.track.progress.description')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;