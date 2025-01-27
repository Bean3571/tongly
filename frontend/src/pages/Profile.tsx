import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

export const Profile = () => {
    const { user, refreshUser } = useAuth();

    const formik = useFormik({
        initialValues: {
            email: user?.email || '',
            firstName: user?.first_name || '',
            lastName: user?.last_name || '',
            profilePicture: user?.profile_picture || '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            firstName: Yup.string(),
            lastName: Yup.string(),
            profilePicture: Yup.string().url('Must be a valid URL').nullable(),
        }),
        onSubmit: async (values) => {
            try {
                const updateData = {
                    email: values.email,
                    first_name: values.firstName || null,
                    last_name: values.lastName || null,
                    profile_picture: values.profilePicture || null,
                };
                
                await api.user.updateProfile(updateData);
                await refreshUser();
                alert('Profile updated successfully');
            } catch (error) {
                console.error('Failed to update profile:', error);
                alert('Failed to update profile');
            }
        },
    });

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md mt-8">
            <div className="flex items-center mb-8">
                <img
                    src={user?.profile_picture || 'https://via.placeholder.com/64'}
                    alt={user?.username}
                    className="w-16 h-16 rounded-full mr-4"
                />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                    <p className="text-gray-600 dark:text-gray-400">@{user?.username}</p>
                </div>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...formik.getFieldProps('email')}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     dark:bg-gray-700 dark:text-white transition-colors
                                     disabled:bg-gray-100 dark:disabled:bg-gray-600"
                        />
                        {formik.touched.email && formik.errors.email && (
                            <div className="text-red-600 dark:text-red-400 text-sm mt-1">{String(formik.errors.email)}</div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            First Name
                        </label>
                        <input
                            id="firstName"
                            type="text"
                            {...formik.getFieldProps('firstName')}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     dark:bg-gray-700 dark:text-white transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            type="text"
                            {...formik.getFieldProps('lastName')}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     dark:bg-gray-700 dark:text-white transition-colors"
                        />
                    </div>

                    <div>
                        <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Profile Picture URL
                        </label>
                        <input
                            id="profilePicture"
                            type="text"
                            {...formik.getFieldProps('profilePicture')}
                            className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     dark:bg-gray-700 dark:text-white transition-colors"
                        />
                        {formik.touched.profilePicture && formik.errors.profilePicture && (
                            <div className="text-red-600 dark:text-red-400 text-sm mt-1">{String(formik.errors.profilePicture)}</div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        onClick={() => formik.resetForm()}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                                 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        disabled={!formik.dirty || !formik.isValid}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium
                                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                                 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}; 