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
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            profilePicture: user?.profilePicture || '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            firstName: Yup.string(),
            lastName: Yup.string(),
            profilePicture: Yup.string().url('Must be a valid URL'),
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
        <div className="max-w-2xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Profile Settings</h1>
            <form onSubmit={formik.handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        {...formik.getFieldProps('email')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {formik.touched.email && formik.errors.email && (
                        <div className="text-red-600 text-sm mt-1">{String(formik.errors.email)}</div>
                    )}
                </div>

                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                    </label>
                    <input
                        id="firstName"
                        type="text"
                        {...formik.getFieldProps('firstName')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                    </label>
                    <input
                        id="lastName"
                        type="text"
                        {...formik.getFieldProps('lastName')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Profile Picture URL
                    </label>
                    <input
                        id="profilePicture"
                        type="text"
                        {...formik.getFieldProps('profilePicture')}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                    Update Profile
                </button>
            </form>
        </div>
    );
}; 