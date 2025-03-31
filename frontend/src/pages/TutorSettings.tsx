import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api, Language, Interest, LanguageProficiency, DegreeType } from '../api/client';
import { Degree, LanguageLevel } from '../types';
import { useTranslation } from '../contexts/I18nContext';

interface ListsData {
    languages: string[];
    interests: string[];
    languageLevels: string[];
    degrees: string[];
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
        if (user && user.credentials && user.credentials.role !== 'tutor') {
            window.location.href = '/dashboard';
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

    const formik = useFormik({
        initialValues: {
            teachingLanguages: user?.tutor?.teaching_languages || [],
            nativeLanguages: user?.tutor?.native_languages || [],
            interests: user?.tutor?.interests || [],
            bio: user?.tutor?.bio || '',
            education: user?.tutor?.degrees || [{ degree: '', institution: '', field_of_study: '', start_year: '', end_year: '' }],
            yearsExperience: user?.tutor?.hourly_rate || 0,
            introVideo: user?.tutor?.introduction_video || '',
        },
        validationSchema: Yup.object({
            teachingLanguages: Yup.array().of(
                Yup.object().shape({
                    language: Yup.string().required(t('validation.language_required')),
                    level: Yup.string().required(t('validation.level_required')),
                })
            ),
            nativeLanguages: Yup.array().of(Yup.string().required(t('validation.native_language_required'))),
            bio: Yup.string().required(t('validation.bio_required')).min(50, t('validation.bio_min_length')),
            education: Yup.array().of(
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
                    teachingLanguages: values.teachingLanguages,
                    nativeLanguages: values.nativeLanguages,
                    degrees: values.education,
                    bio: values.bio,
                    interests: values.interests,
                    introductionVideo: values.introVideo,
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

    // Handle adding a teaching language
    const handleAddTeachingLanguage = () => {
        const newLanguages = [...formik.values.teachingLanguages];
        newLanguages.push({ language: '', level: '' });
        formik.setFieldValue('teachingLanguages', newLanguages);
    };

    // Handle removing a teaching language
    const handleRemoveTeachingLanguage = (index: number) => {
        const newLanguages = [...formik.values.teachingLanguages];
        newLanguages.splice(index, 1);
        formik.setFieldValue('teachingLanguages', newLanguages);
    };

    // Handle adding a native language
    const handleAddNativeLanguage = (language: string) => {
        if (formik.values.nativeLanguages.includes(language)) return;
        formik.setFieldValue('nativeLanguages', [...formik.values.nativeLanguages, language]);
    };

    // Handle removing a native language
    const handleRemoveNativeLanguage = (language: string) => {
        formik.setFieldValue(
            'nativeLanguages',
            formik.values.nativeLanguages.filter(lang => lang !== language)
        );
    };

    // Handle adding education
    const handleAddEducation = () => {
        formik.setFieldValue('education', [
            ...formik.values.education,
            { degree: '', institution: '', field_of_study: '', start_year: '', end_year: '' }
        ]);
    };

    // Handle removing education
    const handleRemoveEducation = (index: number) => {
        const newEducation = [...formik.values.education];
        newEducation.splice(index, 1);
        formik.setFieldValue('education', newEducation);
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
                    {/* Teaching Languages Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.languages_teaching')}
                        </h2>
                        <div className="space-y-4">
                            {formik.values.teachingLanguages.map((lang, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t('pages.tutor_settings.language')}
                                        </label>
                                        <select
                                            value={lang.language}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.teachingLanguages];
                                                newLanguages[index].language = e.target.value;
                                                formik.setFieldValue('teachingLanguages', newLanguages);
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
                                            {t('pages.tutor_settings.proficiency_level')}
                                        </label>
                                        <select
                                            value={lang.level}
                                            onChange={(e) => {
                                                const newLanguages = [...formik.values.teachingLanguages];
                                                newLanguages[index].level = e.target.value;
                                                formik.setFieldValue('teachingLanguages', newLanguages);
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
                                            onClick={() => handleRemoveTeachingLanguage(index)}
                                            className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddTeachingLanguage}
                                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {t('pages.tutor_settings.add_teaching_language')}
                            </button>
                        </div>
                    </div>

                    {/* Native Languages Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                            {t('pages.tutor_settings.native_languages')}
                        </h2>
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formik.values.nativeLanguages.map(language => (
                                    <div 
                                        key={language} 
                                        className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full"
                                    >
                                        <span>{language}</span>
                                        <button 
                                            type="button" 
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100" 
                                            onClick={() => handleRemoveNativeLanguage(language)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <select
                                value=""
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAddNativeLanguage(e.target.value);
                                        e.target.value = "";
                                    }
                                }}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">{t('pages.tutor_settings.add_native_language')}</option>
                                {lists.languages.filter(lang => !formik.values.nativeLanguages.includes(lang)).map((language) => (
                                    <option key={language} value={language}>
                                        {language}
                                    </option>
                                ))}
                            </select>
                            {formik.touched.nativeLanguages && formik.errors.nativeLanguages && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                    {typeof formik.errors.nativeLanguages === 'string' 
                                        ? formik.errors.nativeLanguages 
                                        : t('validation.add_one_native_language')}
                                </p>
                            )}
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
                            {formik.values.education.map((edu, index) => (
                                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                {t('pages.tutor_settings.degree')}
                                            </label>
                                            <select
                                                value={edu.degree}
                                                onChange={(e) => {
                                                    const newEducation = [...formik.values.education];
                                                    newEducation[index].degree = e.target.value;
                                                    formik.setFieldValue('education', newEducation);
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
                                                    const newEducation = [...formik.values.education];
                                                    newEducation[index].institution = e.target.value;
                                                    formik.setFieldValue('education', newEducation);
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
                                                const newEducation = [...formik.values.education];
                                                newEducation[index].field_of_study = e.target.value;
                                                formik.setFieldValue('education', newEducation);
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
                                                    const newEducation = [...formik.values.education];
                                                    newEducation[index].start_year = e.target.value;
                                                    formik.setFieldValue('education', newEducation);
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
                                                    const newEducation = [...formik.values.education];
                                                    newEducation[index].end_year = e.target.value;
                                                    formik.setFieldValue('education', newEducation);
                                                }}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                placeholder="YYYY"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveEducation(index)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                        >
                                            {t('common.remove')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddEducation}
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