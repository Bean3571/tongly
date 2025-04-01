import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { UserRegistrationRequest, UserRole } from '../types';

export const Register = () => {
    const { register } = useAuth();
    const { t } = useTranslation();

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: UserRole.STUDENT
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .min(3, t('validation.username_min_length'))
                .required(t('validation.required')),
            email: Yup.string()
                .email(t('validation.email_invalid'))
                .required(t('validation.required')),
            password: Yup.string()
                .min(6, t('validation.password_min_length'))
                .required(t('validation.required')),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password')], t('validation.password_match'))
                .required(t('validation.required')),
            role: Yup.string()
                .oneOf([UserRole.STUDENT, UserRole.TUTOR], t('validation.role_invalid'))
                .required(t('validation.required'))
        }),
        onSubmit: async (values) => {
            try {
                const registrationData: UserRegistrationRequest = {
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    role: values.role as UserRole,
                };
                
                console.log('Submitting registration data:', {
                    ...registrationData,
                    password: '[REDACTED]'
                });
                
                await register(registrationData);
                
                // The AuthContext will handle redirecting to the appropriate dashboard
            } catch (error: any) {
                console.error('Registration failed:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    details: error.response?.data?.error
                });
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {t('pages.register.title')}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={formik.handleSubmit}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                {t('auth.username')}
                            </label>
                            <input
                                id="username"
                                type="text"
                                {...formik.getFieldProps('username')}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder={t('pages.register.username_placeholder')}
                            />
                            {formik.touched.username && formik.errors.username && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.username}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                {t('auth.email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...formik.getFieldProps('email')}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder={t('pages.register.email_placeholder')}
                            />
                            {formik.touched.email && formik.errors.email && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {t('auth.password')}
                            </label>
                            <input
                                id="password"
                                type="password"
                                {...formik.getFieldProps('password')}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder={t('pages.register.password_placeholder')}
                            />
                            {formik.touched.password && formik.errors.password && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                {t('pages.register.confirm_password')}
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...formik.getFieldProps('confirmPassword')}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                                placeholder={t('pages.register.confirm_password_placeholder')}
                            />
                            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.confirmPassword}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                {t('pages.register.i_want_to')}
                            </label>
                            <select
                                id="role"
                                {...formik.getFieldProps('role')}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm rounded-md bg-white text-gray-900"
                            >
                                <option value={UserRole.STUDENT}>{t('pages.register.role_student')}</option>
                                <option value={UserRole.TUTOR}>{t('pages.register.role_tutor')}</option>
                            </select>
                            {formik.touched.role && formik.errors.role && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.role}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                            {t('pages.register.register_button')}
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
                            {t('pages.register.have_account')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;