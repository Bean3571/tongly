import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../api/client';

const DEFAULT_AVATAR = 'https://secure.gravatar.com/avatar/default?s=200&d=mp';

export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const personalInfoFormik = useFormik({
        initialValues: {
            firstName: user?.personal?.first_name || '',
            lastName: user?.personal?.last_name || '',
            profilePicture: user?.personal?.profile_picture || '',
            age: user?.personal?.age?.toString() || '',
            sex: user?.personal?.sex || '',
        },
        validationSchema: Yup.object({
            firstName: Yup.string(),
            lastName: Yup.string(),
            profilePicture: Yup.string().url('Must be a valid URL'),
            age: Yup.number().min(13, 'Must be at least 13 years old').max(120, 'Invalid age').nullable(),
            sex: Yup.string().oneOf(['male', 'female', ''], 'Invalid gender').nullable(),
        }),
        onSubmit: async (values) => {
            try {
                await api.user.updateProfile({
                    first_name: values.firstName || null,
                    last_name: values.lastName || null,
                    profile_picture: values.profilePicture || null,
                    age: values.age ? parseInt(values.age) : null,
                    sex: values.sex ? (values.sex as 'male' | 'female') : null,
                });
                await refreshUser();
                showNotification('success', 'Personal information updated successfully');
            } catch (error) {
                console.error('Failed to update personal info:', error);
                showNotification('error', 'Failed to update personal information');
            }
        },
    });

    const securityFormik = useFormik({
        initialValues: {
            email: user?.credentials?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address').required('Required'),
            currentPassword: Yup.string().min(6, 'Must be at least 6 characters'),
            newPassword: Yup.string().min(6, 'Must be at least 6 characters'),
            confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], 'Passwords must match'),
        }),
        onSubmit: async (values) => {
            try {
                // Update email if changed
                if (values.email !== user?.credentials?.email) {
                    await api.user.updateProfile({ email: values.email });
                }
                
                // Update password if provided
                if (values.currentPassword && values.newPassword) {
                    await api.user.updatePassword(
                        values.currentPassword,
                        values.newPassword
                    );
                }
                
                await refreshUser();
                showNotification('success', 'Security settings updated successfully');
                securityFormik.resetForm();
            } catch (error) {
                console.error('Failed to update security settings:', error);
                showNotification('error', 'Failed to update security settings');
            }
        },
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.user.uploadProfilePicture(formData);
            await refreshUser();
            showNotification('success', 'Profile picture uploaded successfully');
        } catch (error) {
            console.error('Failed to upload profile picture:', error);
            showNotification('error', 'Failed to upload profile picture');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profile Settings</h1>

                {/* Profile Picture Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <div className="flex items-center space-x-8">
                        <div className="relative group">
                            <img
                                src={user?.personal?.profile_picture || DEFAULT_AVATAR}
                                alt={user?.credentials?.username || 'User'}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_AVATAR;
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-white">
                                    Change Photo
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {user?.credentials?.username}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user?.credentials?.email}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Personal Information
                    </h2>
                    <form onSubmit={personalInfoFormik.handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    {...personalInfoFormik.getFieldProps('firstName')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                {personalInfoFormik.touched.firstName && personalInfoFormik.errors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    {...personalInfoFormik.getFieldProps('lastName')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                {personalInfoFormik.touched.lastName && personalInfoFormik.errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.lastName}</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Profile Picture URL
                            </label>
                            <input
                                id="profilePicture"
                                type="text"
                                {...personalInfoFormik.getFieldProps('profilePicture')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {personalInfoFormik.touched.profilePicture && personalInfoFormik.errors.profilePicture && (
                                <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.profilePicture}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Age
                                </label>
                                <input
                                    id="age"
                                    type="number"
                                    {...personalInfoFormik.getFieldProps('age')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                {personalInfoFormik.touched.age && personalInfoFormik.errors.age && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.age}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Gender
                                </label>
                                <select
                                    id="sex"
                                    {...personalInfoFormik.getFieldProps('sex')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">Not Set</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                                {personalInfoFormik.touched.sex && personalInfoFormik.errors.sex && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.sex}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>

                {/* Account Security Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                        Account Security
                    </h2>
                    <form onSubmit={securityFormik.handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Username
                            </label>
                            <input
                                type="text"    
                                value={user?.credentials?.username}
                                disabled       
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...securityFormik.getFieldProps('email')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {securityFormik.touched.email && securityFormik.errors.email && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                {...securityFormik.getFieldProps('currentPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.currentPassword}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                {...securityFormik.getFieldProps('newPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.newPassword}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...securityFormik.getFieldProps('confirmPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.confirmPassword}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Update Security Settings
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}; 