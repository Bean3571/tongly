import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [role, setRole] = useState<'student' | 'tutor'>('student');

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'student',
            education_degree: '',
            education_institution: '',
            introduction_video: '',
            hourly_rate: '25',
            offers_trial: true,
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, 'Must be at least 3 characters')
                .required('Required'),
            email: Yup.string()
                .email('Invalid email address')
                .required('Required'),
            password: Yup.string()
                .min(8, 'Must be at least 8 characters')
                .required('Required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], 'Passwords must match')
                .required('Required'),
            role: Yup.string()
                .oneOf(['student', 'tutor'], 'Invalid role')
                .required('Required'),
            education_degree: Yup.string()
                .when('role', {
                    is: 'tutor',
                    then: (schema) => schema.required('Required for tutors'),
                }),
            education_institution: Yup.string()
                .when('role', {
                    is: 'tutor',
                    then: (schema) => schema.required('Required for tutors'),
                }),
            introduction_video: Yup.string()
                .when('role', {
                    is: 'tutor',
                    then: (schema) => schema.url('Must be a valid URL').required('Required for tutors'),
                }),
            hourly_rate: Yup.number()
                .when('role', {
                    is: 'tutor',
                    then: (schema) => schema.min(5, 'Minimum rate is $5').max(200, 'Maximum rate is $200').required('Required for tutors'),
                }),
        }),
        onSubmit: async (values) => {
            try {
                const registrationData = {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    role: values.role,
                    ...(values.role === 'tutor' && {
                        education_degree: values.education_degree,
                        education_institution: values.education_institution,
                        introduction_video: values.introduction_video,
                        hourly_rate: parseFloat(values.hourly_rate),
                        offers_trial: values.offers_trial,
                    }),
                };
                await register(registrationData);
                navigate('/login');
            } catch (error) {
                console.error('Registration failed:', error);
            }
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Sign in
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={formik.handleSubmit}>
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Register as
                            </label>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        formik.setFieldValue('role', 'student');
                                        setRole('student');
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        formik.values.role === 'student'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        formik.setFieldValue('role', 'tutor');
                                        setRole('tutor');
                                    }}
                                    className={`px-4 py-2 rounded-lg ${
                                        formik.values.role === 'tutor'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    Tutor
                                </button>
                            </div>
                        </div>

                        {/* Basic Fields */}
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    type="text"
                                    {...formik.getFieldProps('username')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                             dark:bg-gray-700 dark:text-white"
                                />
                                {formik.touched.username && formik.errors.username && (
                                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.username}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    {...formik.getFieldProps('email')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                             dark:bg-gray-700 dark:text-white"
                                />
                                {formik.touched.email && formik.errors.email && (
                                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.email}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    {...formik.getFieldProps('password')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                             dark:bg-gray-700 dark:text-white"
                                />
                                {formik.touched.password && formik.errors.password && (
                                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.password}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    {...formik.getFieldProps('confirmPassword')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                             dark:bg-gray-700 dark:text-white"
                                />
                                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                    <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.confirmPassword}</div>
                                )}
                            </div>
                        </div>

                        {/* Tutor Fields */}
                        {formik.values.role === 'tutor' && (
                            <>
                                <div>
                                    <label htmlFor="education_degree" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Education Degree
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="education_degree"
                                            type="text"
                                            {...formik.getFieldProps('education_degree')}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-md shadow-sm placeholder-gray-400 
                                                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                                     dark:bg-gray-700 dark:text-white"
                                            placeholder="e.g., Bachelor's in English Literature"
                                        />
                                        {formik.touched.education_degree && formik.errors.education_degree && (
                                            <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.education_degree}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="education_institution" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Institution
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="education_institution"
                                            type="text"
                                            {...formik.getFieldProps('education_institution')}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-md shadow-sm placeholder-gray-400 
                                                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                                     dark:bg-gray-700 dark:text-white"
                                            placeholder="e.g., University of Cambridge"
                                        />
                                        {formik.touched.education_institution && formik.errors.education_institution && (
                                            <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.education_institution}</div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="introduction_video" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Introduction Video URL
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="introduction_video"
                                            type="url"
                                            {...formik.getFieldProps('introduction_video')}
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-md shadow-sm placeholder-gray-400 
                                                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                                     dark:bg-gray-700 dark:text-white"
                                            placeholder="e.g., https://youtube.com/watch?v=..."
                                        />
                                        {formik.touched.introduction_video && formik.errors.introduction_video && (
                                            <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.introduction_video}</div>
                                        )}
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Upload a short video introducing yourself and your teaching style to YouTube
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Hourly Rate (USD)
                                    </label>
                                    <div className="mt-1">
                                        <input
                                            id="hourly_rate"
                                            type="number"
                                            {...formik.getFieldProps('hourly_rate')}
                                            min="5"
                                            step="0.01"
                                            className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-md shadow-sm placeholder-gray-400 
                                                     focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                                                     dark:bg-gray-700 dark:text-white"
                                            placeholder="e.g., 25.00"
                                        />
                                        {formik.touched.hourly_rate && formik.errors.hourly_rate && (
                                            <div className="mt-1 text-sm text-red-600 dark:text-red-400">{formik.errors.hourly_rate}</div>
                                        )}
                                    </div>
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
                            </>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                                         text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                         focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                                         dark:focus:ring-offset-gray-800"
                            >
                                Register
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;