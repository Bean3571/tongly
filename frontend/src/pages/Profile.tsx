import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';

interface ProfileUpdateData {
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
}

export const Profile = () => {
    const { user } = useAuth();

    const formik = useFormik<ProfileUpdateData>({
        initialValues: {
            email: user?.email || '',
            firstName: user?.first_name || '',
            lastName: user?.last_name || '',
            profilePicture: user?.profile_picture || '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email').required('Required'),
            firstName: Yup.string(),
            lastName: Yup.string(),
            profilePicture: Yup.string().url('Must be a valid URL'),
        }),
        onSubmit: async (values) => {
            try {
                await api.user.updateProfile(values);
                alert('Profile updated successfully');
            } catch (error) {
                console.error('Failed to update profile:', error);
                alert('Failed to update profile');
            }
        },
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                <form onSubmit={formik.handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                        />
                        {formik.errors.email && formik.touched.email && (
                            <p className="mt-1 text-sm text-red-600">{formik.errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                            First Name
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formik.values.firstName}
                            onChange={formik.handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                            Last Name
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formik.values.lastName}
                            onChange={formik.handleChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700">
                            Profile Picture URL
                        </label>
                        <input
                            id="profilePicture"
                            name="profilePicture"
                            type="text"
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            value={formik.values.profilePicture}
                            onChange={formik.handleChange}
                        />
                        {formik.errors.profilePicture && formik.touched.profilePicture && (
                            <p className="mt-1 text-sm text-red-600">{formik.errors.profilePicture}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Update Profile
                    </button>
                </form>
            </div>
        </div>
    );
}; 