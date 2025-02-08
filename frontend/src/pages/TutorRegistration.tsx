import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../api/client';
import * as Yup from 'yup';
import { useFormik } from 'formik';

const validationSchema = Yup.object({
    education_degree: Yup.string()
        .required('Education degree is required')
        .min(3, 'Must be at least 3 characters'),
    education_institution: Yup.string()
        .required('Institution is required')
        .min(3, 'Must be at least 3 characters'),
    introduction_video: Yup.string()
        .required('Introduction video URL is required')
        .url('Must be a valid URL'),
    hourly_rate: Yup.number()
        .required('Hourly rate is required')
        .min(5, 'Minimum rate is $5')
        .max(200, 'Maximum rate is $200'),
    offers_trial: Yup.boolean()
});

export const TutorRegistration = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formik = useFormik({
        initialValues: {
            education_degree: '',
            education_institution: '',
            introduction_video: '',
            hourly_rate: '25',
            offers_trial: true,
        },
        validationSchema,
        onSubmit: async (values) => {
            setIsSubmitting(true);
            try {
                await api.tutors.register({
                    education_degree: values.education_degree,
                    education_institution: values.education_institution,
                    introduction_video: values.introduction_video,
                    hourly_rate: parseFloat(values.hourly_rate),
                    offers_trial: values.offers_trial,
                });
                
                await refreshUser();
                showNotification('success', 'Successfully registered as a tutor! Your application is under review.');
                navigate('/dashboard');
            } catch (error: any) {
                console.error('Failed to register as tutor:', error);
                showNotification('error', error.response?.data?.error || 'Failed to register as a tutor. Please try again.');
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <p className="text-center text-red-600 dark:text-red-400">
                        Please log in to register as a tutor.
                    </p>
                </div>
            </div>
        );
    }

    if (user.profile?.is_tutor) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <p className="text-center text-yellow-600 dark:text-yellow-400">
                        You are already registered as a tutor.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                        Become a Tutor
                    </h1>

                    <form onSubmit={formik.handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="education_degree" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Education Degree
                            </label>
                            <input
                                type="text"
                                id="education_degree"
                                {...formik.getFieldProps('education_degree')}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    formik.touched.education_degree && formik.errors.education_degree
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                }`}
                                placeholder="e.g., Bachelor's in English Literature"
                            />
                            {formik.touched.education_degree && formik.errors.education_degree && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.education_degree}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="education_institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Institution
                            </label>
                            <input
                                type="text"
                                id="education_institution"
                                {...formik.getFieldProps('education_institution')}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    formik.touched.education_institution && formik.errors.education_institution
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                }`}
                                placeholder="e.g., University of Cambridge"
                            />
                            {formik.touched.education_institution && formik.errors.education_institution && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.education_institution}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="introduction_video" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Introduction Video URL
                            </label>
                            <input
                                type="url"
                                id="introduction_video"
                                {...formik.getFieldProps('introduction_video')}
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    formik.touched.introduction_video && formik.errors.introduction_video
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                }`}
                                placeholder="e.g., https://youtube.com/watch?v=..."
                            />
                            {formik.touched.introduction_video && formik.errors.introduction_video && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.introduction_video}</p>
                            )}
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Upload a short video introducing yourself and your teaching style to YouTube
                            </p>
                        </div>

                        <div>
                            <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Hourly Rate (USD)
                            </label>
                            <input
                                type="number"
                                id="hourly_rate"
                                {...formik.getFieldProps('hourly_rate')}
                                min="5"
                                step="0.01"
                                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                                    formik.touched.hourly_rate && formik.errors.hourly_rate
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                }`}
                                placeholder="e.g., 25.00"
                            />
                            {formik.touched.hourly_rate && formik.errors.hourly_rate && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.hourly_rate}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="offers_trial"
                                {...formik.getFieldProps('offers_trial')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="offers_trial" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                Offer trial lessons (30 minutes at 50% of your hourly rate)
                            </label>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}; 