import React from 'react';
import { useTranslation } from '../contexts/I18nContext';

export const Challenges = () => {
    const { t, formatNumber } = useTranslation();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t('pages.challenges.title')} 🎯
                </h1>
                <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg">
                        <span className="text-blue-600 dark:text-blue-300 font-semibold">
                            🏆 {t('pages.challenges.points', { points: formatNumber(1250) })}
                        </span>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-lg">
                        <span className="text-green-600 dark:text-green-300 font-semibold">
                            {t('pages.challenges.level', { level: 5 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('pages.challenges.progress.title')}
                </h2>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                    {t('pages.challenges.points.to.next.level', { points: formatNumber(750) })}
                </p>
            </div>

            {/* Active Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                    {
                        title: t('pages.challenges.daily.conversation.title'),
                        description: t('pages.challenges.daily.conversation.description'),
                        points: 100,
                        progress: 0,
                        deadline: t('pages.challenges.deadline.24h'),
                        difficulty: 'easy'
                    },
                    {
                        title: t('pages.challenges.grammar.master.title'),
                        description: t('pages.challenges.grammar.master.description'),
                        points: 200,
                        progress: 3,
                        deadline: t('pages.challenges.deadline.3d'),
                        difficulty: 'medium'
                    },
                    {
                        title: t('pages.challenges.cultural.explorer.title'),
                        description: t('pages.challenges.cultural.explorer.description'),
                        points: 150,
                        progress: 2,
                        deadline: t('pages.challenges.deadline.2d'),
                        difficulty: 'easy'
                    }
                ].map((challenge, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                        <div className={`h-2 ${
                            challenge.difficulty === 'easy' ? 'bg-green-500' :
                            challenge.difficulty === 'medium' ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}></div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {challenge.title}
                                </h3>
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 
                                               px-2 py-1 rounded text-sm">
                                    {t('pages.challenges.points.value', { points: challenge.points })}
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {challenge.description}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                                    <span>{t('pages.challenges.progress.value', { current: challenge.progress, total: 5 })}</span>
                                    <span>{challenge.deadline}</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full"
                                        style={{ width: `${(challenge.progress / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Achievements */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('pages.challenges.achievements.title')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { name: t('pages.challenges.achievements.first.lesson'), icon: '🎓', date: t('pages.challenges.date.jan15') },
                        { name: t('pages.challenges.achievements.perfect.week'), icon: '🌟', date: t('pages.challenges.date.jan20') },
                        { name: t('pages.challenges.achievements.quick.learner'), icon: '⚡', date: t('pages.challenges.date.jan22') },
                        { name: t('pages.challenges.achievements.social.butterfly'), icon: '🦋', date: t('pages.challenges.date.jan25') },
                    ].map((achievement, i) => (
                        <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <span className="text-3xl mb-2 block">{achievement.icon}</span>
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {achievement.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {achievement.date}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Challenges; 