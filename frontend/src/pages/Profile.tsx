<<<<<<< Updated upstream
import React, { useState, useRef, useEffect } from 'react';
=======
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
>>>>>>> Stashed changes
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/client';
<<<<<<< Updated upstream
import { Gender, ProfileUpdateData, Language } from '../types';

interface FormData {
    first_name: string;
    last_name: string;
    email: string;
    gender: Gender;
    languages: Language[];
    interests: string[];
    learning_goals: string[];
}

export const Profile = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        email: user?.email || '',
        gender: user?.gender || 'prefer_not_to_say',
        languages: user?.languages || [],
        interests: user?.interests || [],
        learning_goals: user?.learning_goals || []
    });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                gender: user.gender || 'prefer_not_to_say',
                languages: user.languages,
                interests: user.interests,
                learning_goals: user.learning_goals
            });
        }
    }, [user]);

    if (!user) {
        return null;
    }

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('error', 'Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('error', 'Image size should be less than 5MB');
            return;
        }

        try {
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Create form data
            const formData = new FormData();
            formData.append('file', file);

            // Get token
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Upload avatar
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/profile/avatar`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });

            let responseText = await response.text();
            if (!response.ok) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.error || 'Failed to upload avatar');
                } catch (e) {
                    throw new Error(responseText || 'Failed to upload avatar');
                }
            }

            await refreshUser();
            showNotification('success', 'Avatar updated successfully!');
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            showNotification('error', error instanceof Error ? error.message : 'Failed to upload avatar. Please try again.');
            setAvatarPreview(null);
        }
    };

    const validateForm = () => {
        if (!formData.email.trim()) {
            showNotification('error', 'Email is required');
            return false;
        }
        if (!formData.email.includes('@')) {
            showNotification('error', 'Please enter a valid email address');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            const updateData: ProfileUpdateData = {
                first_name: formData.first_name.trim() || undefined,
                last_name: formData.last_name.trim() || undefined,
                gender: formData.gender,
                languages: formData.languages,
                interests: formData.interests,
                learning_goals: formData.learning_goals
            };

            await api.user.updateProfile(updateData);
            await refreshUser();
            setIsEditing(false);
            showNotification('success', 'Profile updated successfully!');
        } catch (error) {
            showNotification('error', 'Failed to update profile');
        }
    };

=======

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

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            First Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.first_name}
                                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                                     focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.last_name}
                                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                                     focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                 rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                                 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Gender
                                        </label>
                                        <select
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                                                     rounded-lg shadow-sm focus:outline-none focus:ring-2 
                                                     focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                        >
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            First Name
                                        </h3>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {user.first_name || 'Not set'}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Last Name
                                        </h3>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {user.last_name || 'Not set'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Email
                                    </h3>
                                    <p className="mt-1 text-gray-900 dark:text-white">{user.email}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Gender
                                        </h3>
                                        <p className="mt-1 text-gray-900 dark:text-white">
                                            {user.gender === 'prefer_not_to_say' 
                                                ? 'Prefer not to say' 
                                                : user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Not set'}
                                        </p>
                                    </div>
                                </div>
                            </div>
=======
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
>>>>>>> Stashed changes
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