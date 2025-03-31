import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api, Language, Interest, Goal, LanguageProficiency } from '../api/client';
import { LanguageLevel } from '../types';
import { useTranslation } from '../contexts/I18nContext';

interface ListsData {
    languages: string[];
    interests: string[];
    goals: string[];
    languageLevels: string[];
}

// Extend the API client type if needed
declare global {
    interface ApiClient {
        lists: {
            getLanguages: () => Promise<Language[]>;
            getInterests: () => Promise<Interest[]>;
            getGoals: () => Promise<Goal[]>;
            getLanguageProficiencies: () => Promise<LanguageProficiency[]>;
        }
    }
}

export const StudentSettings = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lists, setLists] = useState<ListsData>({
        languages: [],
        interests: [],
        goals: [],
        languageLevels: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not a student
    useEffect(() => {
        if (user && user.credentials && user.credentials.role !== 'student') {
            window.location.href = '/dashboard';
        }
    }, [user]);

    // Fetch available lists from the database
    useEffect(() => {
        const fetchLists = async () => {
            try {
                setIsLoading(true);
                const [languages, interests, goals, languageLevels] = await Promise.all([
                    api.lists.getLanguages(),
                    api.lists.getInterests(),
                    api.lists.getGoals(),
                    api.lists.getLanguageProficiencies()
                ]);
                
                setLists({
                    languages: languages.map((lang: Language) => lang.name),
                    interests: interests.map((interest: Interest) => interest.name),
                    goals: goals.map((goal: Goal) => goal.name),
                    languageLevels: languageLevels.map((level: LanguageProficiency) => level.name)
                });
            } catch (error) {
                console.error('Failed to fetch lists:', error);
                showNotification('error', t('notifications.lists_fetch_failed'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchLists();
    }, [showNotification, t]);

    const formik = useFormik({
        initialValues: {
            languages: user?.student?.learning_languages || [],
            goals: user?.student?.learning_goals || [],
            interests: user?.student?.interests || [],
        },
        validationSchema: Yup.object({
            languages: Yup.array().of(
                Yup.object().shape({
                    language: Yup.string().required(t('validation.language_required')),
                    level: Yup.string().required(t('validation.level_required')),
                })
            ),
            goals: Yup.array().of(Yup.string()),
            interests: Yup.array().of(Yup.string()),
        }),
        onSubmit: async (values) => {
            try {
                setIsSubmitting(true);
                await api.user.updateProfile({
                    languages: values.languages,
                    learning_goals: values.goals,
                    interests: values.interests,
                });
                await refreshUser();
                showNotification('success', t('notifications.preferences_updated'));
            } catch (error) {
                console.error('Failed to update student preferences:', error);
                showNotification('error', t('notifications.preferences_update_failed'));
            } finally {
                setIsSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    // Handle adding a new language
    const handleAddLanguage = () => {
        const newLanguages = [...formik.values.languages];
        newLanguages.push({ language: '', level: '' });
        formik.setFieldValue('languages', newLanguages);
    };

    // Handle removing a language
    const handleRemoveLanguage = (index: number) => {
        const newLanguages = [...formik.values.languages];
        newLanguages.splice(index, 1);
        formik.setFieldValue('languages', newLanguages);
    };

    // Toggle a goal in the array
    const handleToggleGoal = (goal: string) => {
        const newGoals = [...formik.values.goals];
        if (newGoals.includes(goal)) {
            formik.setFieldValue('goals', newGoals.filter(g => g !== goal));
        } else {
            newGoals.push(goal);
            formik.setFieldValue('goals', newGoals);
        }
    };

    // Toggle an interest in the array
    const handleToggleInterest = (interest: string) => {
        const newInterests = [...formik.values.interests];
        if (newInterests.includes(interest)) {
            formik.setFieldValue('interests', newInterests.filter(i => i !== interest));
        } else {
            newInterests.push(interest);
            formik.setFieldValue('interests', newInterests);
        }
    };

    if (isLoading) {
        return <div className="container mx-auto py-8 px-4">{t('common.loading')}</div>;
    }

    if (!user || !user.student) {
        return <div className="container mx-auto py-8 px-4">{t('errors.profile_not_found')}</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('pages.student_settings.title')}</h1>
                
                <form onSubmit={formik.handleSubmit}>
                    {/* Languages Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.student_settings.languages_learning')}
                        </h2>
                        <div className="space-y-4">
                            {formik.values.languages.map((lang, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.student_settings.language')}
                                        </label>
                                        <select
                                            value={lang.language}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.languages];
                                                newLanguages[index].language = e.target.value;
                                                formik.setFieldValue('languages', newLanguages);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">{t('common.select_language')}</option>
                                            {lists.languages.map((language) => (
                                                <option key={language} value={language}>
                                                    {language}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.student_settings.proficiency_level')}
                                        </label>
                                        <select
                                            value={lang.level}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.languages];
                                                newLanguages[index].level = e.target.value;
                                                formik.setFieldValue('languages', newLanguages);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">{t('common.select_level')}</option>
                                            {lists.languageLevels.map((level) => (
                                                <option key={level} value={level}>
                                                    {level}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLanguage(index)}
                                            className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddLanguage}
                                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {t('pages.student_settings.add_language')}
                            </button>
                        </div>
                    </div>

                    {/* Learning Goals Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.student_settings.learning_goals')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {lists.goals.map((goal) => (
                                <div key={goal} className="flex items-center">
                                    <input
                                        id={`goal-${goal}`}
                                        type="checkbox"
                                        checked={formik.values.goals.includes(goal)}
                                        onChange={() => handleToggleGoal(goal)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`goal-${goal}`}
                                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {goal}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interests Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.student_settings.interests')}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {lists.interests.map((interest) => (
                                <div key={interest} className="flex items-center">
                                    <input
                                        id={`interest-${interest}`}
                                        type="checkbox"
                                        checked={formik.values.interests.includes(interest)}
                                        onChange={() => handleToggleInterest(interest)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label
                                        htmlFor={`interest-${interest}`}
                                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        {interest}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !formik.isValid || !formik.dirty}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentSettings; 