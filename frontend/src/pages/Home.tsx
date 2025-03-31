import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { Link } from 'react-router-dom';

export const Home = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                    <span className="block">Языкус</span>
                    <span className="block text-accent-primary">{t('home.subtitle')}</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    {t('home.description')}
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                    {!user ? (
                        <>
                            <div className="rounded-md shadow">
                                <Link
                                    to="/register"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-primary hover:bg-accent-primary-hover md:py-4 md:text-lg md:px-10"
                                >
                                    {t('auth.register')}
                                </Link>
                            </div>
                            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                                <Link
                                    to="/login"
                                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-accent-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                                >
                                    {t('auth.login')}
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            {user.credentials?.role === 'student' ? (
                                <div className="rounded-md shadow">
                                    <Link
                                        to="/tutors"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-primary hover:bg-accent-primary-hover md:py-4 md:text-lg md:px-10"
                                    >
                                        {t('home.find_tutors')}
                                    </Link>
                                </div>
                            ) : (
                                <div className="rounded-md shadow">
                                    <Link
                                        to="/lessons"
                                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-accent-primary hover:bg-accent-primary-hover md:py-4 md:text-lg md:px-10"
                                    >
                                        {t('home.my_lessons')}
                                    </Link>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className="mt-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                {t('home.features.learn_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                                <p>{t('home.features.learn_description')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                {t('home.features.connect_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                                <p>{t('home.features.connect_description')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                {t('home.features.grow_title')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">
                                <p>{t('home.features.grow_description')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 