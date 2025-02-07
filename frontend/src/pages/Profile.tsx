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
            firstName: user?.profile?.first_name || '',
            lastName: user?.profile?.last_name || '',
            profilePicture: user?.profile?.profile_picture || '',
            age: user?.profile?.age?.toString() || '',
            sex: user?.profile?.sex || '',
        },
        validationSchema: Yup.object({
            firstName: Yup.string(),
            lastName: Yup.string(),
            age: Yup.number().min(0).max(150).nullable().transform((value) => 
                isNaN(value) ? null : value
            ),
            sex: Yup.string().oneOf(['male', 'female', 'other']).nullable(),
        }),
        onSubmit: async (values) => {
            try {
                await api.user.updateProfile({
                    first_name: values.firstName || null,
                    last_name: values.lastName || null,
                    profile_picture: values.profilePicture || null,
                    age: values.age ? Number(values.age) : null,
                    sex: values.sex as 'male' | 'female' | 'other' | null,
                });
                await refreshUser();
                showNotification('success', 'Personal information updated successfully');
            } catch (error) {
                console.error('Failed to update profile:', error);
                showNotification('error', 'Failed to update personal information');
            }
        },
        enableReinitialize: true,
    });

    const securityFormik = useFormik({
        initialValues: {
            email: user?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        validationSchema: Yup.object({
            email: Yup.string().email('Invalid email address'),
            currentPassword: Yup.string()
                .min(6, 'Password must be at least 6 characters'),
            newPassword: Yup.string()
                .min(8, 'Password must be at least 8 characters'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('newPassword')], 'Passwords must match')
                .when('newPassword', {
                    is: (val: string) => val && val.length > 0,
                    then: (schema) => schema.required('Please confirm your password'),
                }),
        }),
        onSubmit: async (values) => {
            try {
                // Update email if changed
                if (values.email !== user?.email) {
                    await api.user.updateProfile({ email: values.email });
                }

                // Update password if provided
                if (values.currentPassword && values.newPassword) {
                    await api.user.updatePassword(values.currentPassword, values.newPassword);
                }

                await refreshUser();
                showNotification('success', 'Security settings updated successfully');
                setIsChangingPassword(false);
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
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Profile Settings</h1>

            {/* Personal Information Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Personal Information
                </h2>
                <form onSubmit={personalInfoFormik.handleSubmit} className="space-y-6">
                    <div className="flex items-center space-x-6 mb-6">
                        <div className="relative group">
                            <img
                                src={user?.profile?.profile_picture || DEFAULT_AVATAR}
                                alt={user?.username || 'User'}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_AVATAR;
                                }}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                Change Photo
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {user?.username}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {user?.email}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                {...personalInfoFormik.getFieldProps('firstName')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                         dark:bg-gray-700 dark:text-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                {...personalInfoFormik.getFieldProps('lastName')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                         dark:bg-gray-700 dark:text-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Age
                            </label>
                            <input
                                type="number"
                                {...personalInfoFormik.getFieldProps('age')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                         dark:bg-gray-700 dark:text-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Sex
                            </label>
                            <select
                                {...personalInfoFormik.getFieldProps('sex')}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                         dark:bg-gray-700 dark:text-white transition-colors"
                            >
                                <option value="">Select...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                                     transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Security Settings
                </h2>
                <form onSubmit={securityFormik.handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Username (not editable)
                        </label>
                        <input
                            type="text"
                            value={user?.username}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            {...securityFormik.getFieldProps('email')}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                     dark:bg-gray-700 dark:text-white transition-colors"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <button
                            type="button"
                            onClick={() => setIsChangingPassword(!isChangingPassword)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                                     font-medium transition-colors"
                        >
                            {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
                        </button>

                        {isChangingPassword && (
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        {...securityFormik.getFieldProps('currentPassword')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 dark:bg-gray-700 dark:text-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        {...securityFormik.getFieldProps('newPassword')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 dark:bg-gray-700 dark:text-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        {...securityFormik.getFieldProps('confirmPassword')}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                                                 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                                 dark:bg-gray-700 dark:text-white transition-colors"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                                     transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}; 