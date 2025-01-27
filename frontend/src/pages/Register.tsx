import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
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
        }),
        onSubmit: async (values) => {
            try {
                await register(values.username, values.email, values.password);
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