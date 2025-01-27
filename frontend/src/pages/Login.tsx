import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoginCredentials } from '../types';

interface LoginResponse {
    token: string;
}

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const formik = useFormik<LoginCredentials>({
        initialValues: {
            username: '',
            password: '',
        },
        validationSchema: Yup.object({
            username: Yup.string().required('Required'),
            password: Yup.string().required('Required'),
        }),
        onSubmit: async (values: LoginCredentials) => {
            try {
                const response = await apiClient.post<LoginResponse>('/auth/login', values);
                await login(values.username, values.password);
                navigate('/');
            } catch (error) {
                console.error('Login failed:', error);
            }
        },
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <h2 className="text-3xl font-bold text-center text-gray-900">Sign in</h2>
                <form onSubmit={formik.handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                value={formik.values.username}
                                onChange={formik.handleChange}
                            />
                            {formik.errors.username && formik.touched.username && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.username}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                                value={formik.values.password}
                                onChange={formik.handleChange}
                            />
                            {formik.errors.password && formik.touched.password && (
                                <p className="mt-1 text-sm text-red-600">{formik.errors.password}</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Sign in
                    </button>
                </form>
            </div>
        </div>
    );
};