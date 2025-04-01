import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { LoginRequest, UserRole } from '../types';

export const Login = () => {
    const { login, user } = useAuth();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already logged in
    if (user) {
        return <Navigate to={user.role === UserRole.TUTOR ? '/tutor/dashboard' : '/dashboard'} />;
    }

    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
        },
        validationSchema: Yup.object({
            username: Yup.string().required(t('validation.required')),
            password: Yup.string().required(t('validation.required')),
        }),
        onSubmit: async (values) => {
            try {
                setIsLoading(true);
                setError(null);
                
                const loginRequest: LoginRequest = {
                    username: values.username,
                    password: values.password
                };
                
                await login(loginRequest);
                // The auth context will handle redirection after successful login
            } catch (error: any) {
                console.error('Login failed:', error);
                setError(error.message || t('auth.errors.invalidCredentials'));
            } finally {
                setIsLoading(false);
            }
        },
    });

    return (
        <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900">
                    {t('pages.login.title')}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {t('pages.login.no_account')}{' '}
                    <Link to="/register" className="font-medium text-orange-600 hover:text-orange-500">
                        {t('auth.register')}
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-md rounded-lg sm:px-10 border border-gray-200">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}
                    
                    <form className="space-y-6" onSubmit={formik.handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                {t('auth.username')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    {...formik.getFieldProps('username')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-orange-500 focus:border-orange-500 
                                             bg-white text-gray-900"
                                    placeholder={t('pages.login.username_placeholder')}
                                />
                                {formik.touched.username && formik.errors.username && (
                                    <div className="mt-1 text-sm text-red-600">{formik.errors.username}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {t('auth.password')}
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    {...formik.getFieldProps('password')}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                                             rounded-md shadow-sm placeholder-gray-400 
                                             focus:outline-none focus:ring-orange-500 focus:border-orange-500 
                                             bg-white text-gray-900"
                                    placeholder={t('pages.login.password_placeholder')}
                                />
                                {formik.touched.password && formik.errors.password && (
                                    <div className="mt-1 text-sm text-red-600">{formik.errors.password}</div>
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting || isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                                         text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                         focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? t('common.loading') : t('pages.login.sign_in_button')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;