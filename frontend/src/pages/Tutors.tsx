import React from 'react';
import { useTranslation } from '../contexts/I18nContext';

export const Tutors = () => {
    const { t } = useTranslation();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                {t('tutors.search.title')}
            </h1>

            {/* Search and Filter Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                        type="text"
                        placeholder={t('tutors.search.placeholder')}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">{t('tutors.search.filters.language')}</option>
                        <option value="english">English</option>
                        <option value="spanish">Spanish</option>
                        <option value="french">French</option>
                    </select>
                    <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">{t('tutors.search.filters.price')}</option>
                        <option value="0-20">$0 - $20</option>
                        <option value="20-40">$20 - $40</option>
                        <option value="40+">$40+</option>
                    </select>
                </div>
            </div>

            {/* Tutors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Placeholder Tutor Cards */}
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <img
                                    src={`https://via.placeholder.com/64`}
                                    alt={t('tutors.card.tutor_image')}
                                    className="w-16 h-16 rounded-full mr-4"
                                />
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {t('tutors.card.tutor_name', { number: i })}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {t('tutors.card.languages')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t('tutors.card.description')}
                            </p>
                            <div className="flex justify-between items-center">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                    {t('tutors.card.price_per_hour', { price: 25 })}
                                </span>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                                 transition-colors">
                                    {t('tutors.card.view_profile')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tutors; 