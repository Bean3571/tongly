import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
    const { login, user } = useAuth();

    // Redirect if already logged in
    if (user) {
        return <Navigate to="/dashboard" />;
    }

    const formik = useFormik({
        initialValues: {
            username: '',
            password: '',
        },
        validationSchema: Yup.object({
            username: Yup.string().required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values) => {
            try {
                await login(values.username, values.password);
            } catch (error) {
                console.error('Login failed:', error);
            }
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                        Sign up
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={formik.handleSubmit}>
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
                            <button
                                type="submit"
                                disabled={!formik.isValid || formik.isSubmitting}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                                         text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                         focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed
                                         dark:focus:ring-offset-gray-800"
                            >
                                Sign in
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;