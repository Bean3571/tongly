import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api, Language, Interest, LanguageProficiency, DegreeType } from '../api/client';
import { TutorProfile } from '../types';
import { useTranslation } from '../contexts/I18nContext';

interface ListsData {
    languages: string[];
    interests: string[];
    languageLevels: string[];
    degrees: string[];
}

interface TutorFormValues {
    teachingLanguages: { language_id: number; proficiency_id: number }[];
    interests: string[];
    bio: string;
    degrees: {
        degree: string;
        institution: string;
        field_of_study: string;
        start_year: string;
        end_year: string;
    }[];
    yearsExperience: number;
    introVideo: string;
}

export const TutorSettings = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUploading, setVideoUploading] = useState(false);
    const [lists, setLists] = useState<ListsData>({
        languages: [],
        interests: [],
        languageLevels: [],
        degrees: []
    });
    const [isLoading, setIsLoading] = useState(true);

    // Redirect if not a tutor
    useEffect(() => {
        if (user && user.credentials.role !== 'tutor') {
            window.location.href = '/home';
        }
    }, [user]);

    // Fetch available lists from the database
    useEffect(() => {
        const fetchLists = async () => {
            try {
                setIsLoading(true);
                const [languages, interests, languageLevels, degrees] = await Promise.all([
                    api.lists.getLanguages(),
                    api.lists.getInterests(),
                    api.lists.getLanguageProficiencies(),
                    api.lists.getDegrees()
                ]);
                
                setLists({
                    languages: languages.map((lang: Language) => lang.name),
                    interests: interests.map((interest: Interest) => interest.name),
                    languageLevels: languageLevels.map((level: LanguageProficiency) => level.name),
                    degrees: degrees.map((degree: DegreeType) => degree.name)
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

    const formik = useFormik<TutorFormValues>({
        initialValues: {
            teachingLanguages: [],
            interests: [],
            bio: '',
            degrees: [{ degree: '', institution: '', field_of_study: '', start_year: '', end_year: '' }],
            yearsExperience: 0,
            introVideo: '',
        },
        validationSchema: Yup.object({
            teachingLanguages: Yup.array().of(
                Yup.object().shape({
                    language_id: Yup.number().required(t('validation.language_required')),
                    proficiency_id: Yup.number().required(t('validation.level_required')),
                })
            ),
            bio: Yup.string().required(t('validation.bio_required')).min(50, t('validation.bio_min_length')),
            degrees: Yup.array().of(
                Yup.object().shape({
                    degree: Yup.string().required(t('validation.degree_required')),
                    institution: Yup.string().required(t('validation.institution_required')),
                    field_of_study: Yup.string().required(t('validation.field_required')),
                    start_year: Yup.string().required(t('validation.start_year_required')),
                    end_year: Yup.string().required(t('validation.end_year_required')),
                })
            ),
            yearsExperience: Yup.number().min(0, t('validation.years_min')).required(t('validation.years_required')),
            introVideo: Yup.string().url(t('validation.valid_url')),
            interests: Yup.array().of(Yup.string()),
        }),
        onSubmit: async (values) => {
            try {
                setIsSubmitting(true);

                // Update tutor profile with the backend API
                await api.tutors.updateProfile({
                    bio: values.bio,
                    introductionVideo: values.introVideo,
                    interests: values.interests,
                    teachingLanguages: values.teachingLanguages,
                    degrees: values.degrees
                });

                await refreshUser();
                showNotification('success', t('notifications.tutor_profile_updated'));
            } catch (error) {
                console.error('Failed to update tutor profile:', error);
                showNotification('error', t('notifications.tutor_profile_update_failed'));
            } finally {
                setIsSubmitting(false);
            }
        },
        enableReinitialize: true,
    });

    // Handle uploading intro video
    const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setVideoFile(file);
        setVideoUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.tutors.uploadVideo(formData);
            formik.setFieldValue('introVideo', response.videoUrl);
            showNotification('success', t('notifications.video_uploaded'));
        } catch (error) {
            console.error('Failed to upload video:', error);
            showNotification('error', t('notifications.video_upload_failed'));
        } finally {
            setVideoUploading(false);
        }
    };

    // Handle adding a language
    const handleAddLanguage = () => {
        const newLanguages = [...formik.values.teachingLanguages];
        newLanguages.push({ language_id: 0, proficiency_id: 0 });
        formik.setFieldValue('teachingLanguages', newLanguages);
    };

    // Handle removing a language
    const handleRemoveLanguage = (index: number) => {
        const newLanguages = [...formik.values.teachingLanguages];
        newLanguages.splice(index, 1);
        formik.setFieldValue('teachingLanguages', newLanguages);
    };

    // Handle adding a degree
    const handleAddDegree = () => {
        const newDegrees = [...formik.values.degrees];
        newDegrees.push({ degree: '', institution: '', field_of_study: '', start_year: '', end_year: '' });
        formik.setFieldValue('degrees', newDegrees);
    };

    // Handle removing a degree
    const handleRemoveDegree = (index: number) => {
        const newDegrees = [...formik.values.degrees];
        newDegrees.splice(index, 1);
        formik.setFieldValue('degrees', newDegrees);
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

    if (!user) {
        return <div className="container mx-auto py-8 px-4">{t('errors.profile_not_found')}</div>;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('pages.tutor_settings.title')}</h1>
                
                <form onSubmit={formik.handleSubmit}>
                    {/* Languages Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.languages')}
                        </h2>
                        <div className="space-y-4">
                            {formik.values.teachingLanguages.map((lang, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.tutor_settings.language')}
                                        </label>
                                        <select
                                            value={lang.language_id}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.teachingLanguages];
                                                newLanguages[index].language_id = parseInt(e.target.value);
                                                formik.setFieldValue('teachingLanguages', newLanguages);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">{t('common.select_language')}</option>
                                            {lists.languages.map((language, idx) => (
                                                <option key={idx} value={idx + 1}>
                                                    {language}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.tutor_settings.proficiency_level')}
                                        </label>
                                        <select
                                            value={lang.proficiency_id}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.teachingLanguages];
                                                newLanguages[index].proficiency_id = parseInt(e.target.value);
                                                formik.setFieldValue('teachingLanguages', newLanguages);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="">{t('common.select_level')}</option>
                                            {lists.languageLevels.map((level, idx) => (
                                                <option key={idx} value={idx + 1}>
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
                                {t('pages.tutor_settings.add_language')}
                            </button>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.bio')}
                        </h2>
                        <div>
                            <textarea
                                rows={5}
                                {...formik.getFieldProps('bio')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder={t('pages.tutor_settings.bio_placeholder')}
                            />
                            {formik.touched.bio && formik.errors.bio && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* Education Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.education')}
                        </h2>
                        <div className="space-y-6">
                            {formik.values.degrees.map((edu, index) => (
                                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {t('pages.tutor_settings.degree')}
                                            </label>
                                            <select
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newDegrees = [...formik.values.degrees];
                                                    newDegrees[index].degree = e.target.value;
                                                    formik.setFieldValue('degrees', newDegrees);
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            >
                                                <option value="">{t('common.select_degree')}</option>
                                                {lists.degrees.map((degree) => (
                                                    <option key={degree} value={degree}>
                                                        {degree}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {t('pages.tutor_settings.institution')}
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.institution}
                                                onChange={(e) => {
                                                    const newDegrees = [...formik.values.degrees];
                                                    newDegrees[index].institution = e.target.value;
                                                    formik.setFieldValue('degrees', newDegrees);
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder={t('pages.tutor_settings.institution_placeholder')}
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.tutor_settings.field_of_study')}
                                        </label>
                                        <input
                                            type="text"
                                            value={edu.field_of_study}
                                            onChange={(e) => {
                                                const newDegrees = [...formik.values.degrees];
                                                newDegrees[index].field_of_study = e.target.value;
                                                formik.setFieldValue('degrees', newDegrees);
                                            }}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder={t('pages.tutor_settings.field_of_study_placeholder')}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {t('pages.tutor_settings.start_year')}
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.start_year}
                                                onChange={(e) => {
                                                    const newDegrees = [...formik.values.degrees];
                                                    newDegrees[index].start_year = e.target.value;
                                                    formik.setFieldValue('degrees', newDegrees);
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="YYYY"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {t('pages.tutor_settings.end_year')}
                                            </label>
                                            <input
                                                type="text"
                                                value={edu.end_year}
                                                onChange={(e) => {
                                                    const newDegrees = [...formik.values.degrees];
                                                    newDegrees[index].end_year = e.target.value;
                                                    formik.setFieldValue('degrees', newDegrees);
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="YYYY"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDegree(index)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddDegree}
                                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {t('pages.tutor_settings.add_education')}
                            </button>
                        </div>
                    </div>

                    {/* Years of Experience Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.years_experience')}
                        </h2>
                        <div>
                            <input
                                type="number"
                                min="0"
                                {...formik.getFieldProps('yearsExperience')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                            {formik.touched.yearsExperience && formik.errors.yearsExperience && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.yearsExperience}</p>
                            )}
                        </div>
                    </div>

                    {/* Intro Video Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.intro_video')}
                        </h2>
                        <div>
                            {formik.values.introVideo && (
                                <div className="mb-4">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{t('pages.tutor_settings.current_video')}:</p>
                                    <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden">
                                        <iframe 
                                            src={formik.values.introVideo}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        ></iframe>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('pages.tutor_settings.video_url')}
                                </label>
                                <input
                                    type="text"
                                    {...formik.getFieldProps('introVideo')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder={t('pages.tutor_settings.video_url_placeholder')}
                                />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('pages.tutor_settings.video_url_help')}
                                </p>
                                {formik.touched.introVideo && formik.errors.introVideo && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.introVideo}</p>
                                )}
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('pages.tutor_settings.upload_new_video')}:
                                </label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label 
                                    htmlFor="video-upload"
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                >
                                    {videoUploading ? t('common.uploading') : t('pages.tutor_settings.select_video')}
                                </label>
                                {videoFile && (
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        {t('pages.tutor_settings.selected_file')}: {videoFile.name}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Interests Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.interests')}
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
                            disabled={isSubmitting || !formik.isValid || !formik.dirty || videoUploading}
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

export default TutorSettings; 