import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { api } from '../api/client';
import { useTranslation } from '../contexts/I18nContext';

const DEFAULT_AVATAR = 'https://secure.gravatar.com/avatar/default?s=200&d=mp';

// Define a generic user settings type to handle both structure formats
interface UserSettingsData {
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    age?: number | null | string;
    sex?: string | null;
}

export const UserSettings = () => {
    const { user, refreshUser } = useAuth();
    const { showNotification } = useNotification();
    const { t } = useTranslation();
    const [isUpdatingPersonal, setIsUpdatingPersonal] = useState(false);
    const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);
    
    // Log user data for debugging
    console.log('Current user data:', user);
    
    // Helper function to safely access user fields regardless of API response structure
    const getUserField = (field: string, defaultValue: string = '') => {
        if (!user) return defaultValue;
        
        // Try personal field first (our types/index.ts definition)
        if (user.personal && user.personal[field as keyof typeof user.personal] !== undefined) {
            return String(user.personal[field as keyof typeof user.personal] || defaultValue);
        }
        
        // Try userSettings field next (possibly from API client)
        if ((user as any).userSettings && (user as any).userSettings[field] !== undefined) {
            return String((user as any).userSettings[field] || defaultValue);
        }
        
        // Try directly on user object
        if (user[field as keyof typeof user] !== undefined) {
            return String(user[field as keyof typeof user] || defaultValue);
        }
        
        return defaultValue;
    };

    // Initialize user info state
    const [userInfo, setUserInfo] = useState({
        firstName: getUserField('first_name'),
        lastName: getUserField('last_name'),
        userPicture: getUserField('profile_picture'),
        age: getUserField('age'),
        sex: getUserField('sex'),
        email: user?.credentials?.email || '',
    });

    // Update local state when user data changes
    useEffect(() => {
        if (user) {
            console.log('Updating user info from:', user);
            
            setUserInfo({
                firstName: getUserField('first_name'),
                lastName: getUserField('last_name'),
                userPicture: getUserField('profile_picture'),
                age: getUserField('age'),
                sex: getUserField('sex'),
                email: user.credentials?.email || '',
            });
        }
    }, [user]);

    const personalInfoFormik = useFormik({
        initialValues: {
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            userPicture: userInfo.userPicture,
            age: userInfo.age,
            sex: userInfo.sex || 'not_set',
        },
        enableReinitialize: true, // This will update form values when initialValues change
        validationSchema: Yup.object({
            firstName: Yup.string().max(50, t('validation.first_name_max_length')),
            lastName: Yup.string().max(50, t('validation.last_name_max_length')),
            userPicture: Yup.string().url(t('validation.url_invalid')),
            age: Yup.number().min(13, t('validation.age_min')).max(120, t('validation.age_max')).nullable().transform((value) => (isNaN(value) ? null : value)),
            sex: Yup.string().oneOf(['male', 'female', 'not_set'], t('validation.sex_invalid')).nullable(),
        }),
        onSubmit: async (values) => {
            try {
                setIsUpdatingPersonal(true);
                console.log('Submitting user settings update:', values);
                
                await api.user.updateProfile({
                    first_name: values.firstName || null,
                    last_name: values.lastName || null,
                    profile_picture: values.userPicture || null,
                    age: values.age ? parseInt(values.age) : null,
                    sex: values.sex ? values.sex === 'not_set' ? null : (values.sex as 'male' | 'female') : null,
                });
                await refreshUser();
                showNotification('success', t('notifications.personal_info_updated'));
            } catch (error) {
                console.error('Failed to update personal info:', error);
                showNotification('error', t('notifications.personal_info_update_failed'));
            } finally {
                setIsUpdatingPersonal(false);
            }
        },
    });

    const securityFormik = useFormik({
        initialValues: {
            email: userInfo.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
        enableReinitialize: true, // This will update form values when initialValues change
        validationSchema: Yup.object({
            email: Yup.string().email(t('validation.email_invalid')).required(t('validation.required')),
            currentPassword: Yup.string().min(6, t('validation.password_min_length')),
            newPassword: Yup.string().min(6, t('validation.password_min_length')),
            confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], t('validation.password_match')),
        }),
        onSubmit: async (values) => {
            try {
                setIsUpdatingSecurity(true);
                
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
                showNotification('success', t('notifications.security_settings_updated'));
                securityFormik.resetForm({
                    values: {
                        ...securityFormik.values,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                    }
                });
            } catch (error) {
                console.error('Failed to update security settings:', error);
                showNotification('error', t('notifications.security_settings_update_failed'));
            } finally {
                setIsUpdatingSecurity(false);
            }
        },
    });

    // Function to load user data initially or refresh
    const loadUserData = async () => {
        try {
            await refreshUser();
            console.log('User data refreshed');
        } catch (error) {
            console.error('Failed to load user data:', error);
            showNotification('error', t('notifications.user_data_fetch_failed'));
        }
    };

    // Load user data when component mounts
    useEffect(() => {
        loadUserData();
    }, []);

    // Helper to safely get user picture URL
    const getUserPictureUrl = () => {
        if (!user) return DEFAULT_AVATAR;
        
        // Try both locations
        const personalPic = user.personal?.profile_picture;
        const userSettingsPic = (user as any).userSettings?.profile_picture;
        
        return personalPic || userSettingsPic || DEFAULT_AVATAR;
    };

    // Get formatted name for display
    const getDisplayName = () => {
        const firstName = userInfo.firstName;
        const lastName = userInfo.lastName;
        
        if (firstName && lastName) {
            return `${firstName} ${lastName}`;
        } else if (firstName) {
            return firstName;
        } else if (lastName) {
            return lastName;
        } else {
            return user?.credentials?.username || t('common.user');
        }
    };
    
    // Debug information to log what's available in the user object
    console.log('User credentials:', user?.credentials);
    console.log('Current email in userInfo:', userInfo.email);
    console.log('Current email in user.credentials:', user?.credentials?.email);

    // Display current values or loading state
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 bg-white flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600 mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-white">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('pages.userSettings.title')}</h1>

                {/* User Picture Section */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
                    <div className="flex items-center space-x-8">
                        <div>
                            <img
                                src={getUserPictureUrl()}
                                alt={getDisplayName()}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_AVATAR;
                                }}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                {getDisplayName()}
                            </h3>
                            <p className="text-gray-500">
                                {user.credentials?.username !== "unknown" && (
                                    <span className="block">@{user.credentials?.username}</span>
                                )}
                                {(user.credentials?.email || userInfo.email) && (
                                    <span className="block">{user.credentials?.email || userInfo.email}</span>
                                )}
                            </p>
                            <p className="text-sm font-medium text-orange-600 mt-1">
                                {user?.credentials?.role === 'student' ? t('auth.roles.student') : t('auth.roles.tutor')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {t('pages.userSettings.personal_info')}
                    </h2>
                    
                    {/* Add debug info to see what's in the user object */}
                    {process.env.NODE_ENV === 'development' && (
                        <pre className="bg-gray-100 p-3 rounded text-xs mb-4 overflow-auto max-h-32">
                            User info: {JSON.stringify({
                                credentials: user?.credentials,
                                userInfo: userInfo
                            }, null, 2)}
                        </pre>
                    )}
                    
                    <form onSubmit={personalInfoFormik.handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                    {t('userSettings.fields.first_name')}
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    {...personalInfoFormik.getFieldProps('firstName')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                                />
                                {personalInfoFormik.touched.firstName && personalInfoFormik.errors.firstName && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.firstName}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                    {t('userSettings.fields.last_name')}
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    {...personalInfoFormik.getFieldProps('lastName')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                                />
                                {personalInfoFormik.touched.lastName && personalInfoFormik.errors.lastName && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.lastName}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                                    {t('userSettings.fields.age')}
                                </label>
                                <input
                                    id="age"
                                    type="number"
                                    {...personalInfoFormik.getFieldProps('age')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                                />
                                {personalInfoFormik.touched.age && personalInfoFormik.errors.age && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.age}</p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                                    {t('userSettings.fields.gender')}
                                </label>
                                <select
                                    id="sex"
                                    {...personalInfoFormik.getFieldProps('sex')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                                >
                                    <option value="not_set">{t('userSettings.gender.not_set')}</option>
                                    <option value="male">{t('userSettings.gender.male')}</option>
                                    <option value="female">{t('userSettings.gender.female')}</option>
                                </select>
                                {personalInfoFormik.touched.sex && personalInfoFormik.errors.sex && (
                                    <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.sex}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isUpdatingPersonal || !personalInfoFormik.dirty || !personalInfoFormik.isValid}
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
                            >
                                {isUpdatingPersonal ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Account Security Section */}
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">
                        {t('pages.userSettings.account_settings')}
                    </h2>
                    <form onSubmit={securityFormik.handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                {t('auth.username')}
                            </label>
                            <input
                                type="text"    
                                value={user.credentials?.username === "unknown" ? "" : (user.credentials?.username || "")}
                                disabled       
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                {t('auth.email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                {...securityFormik.getFieldProps('email')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                            />
                            {securityFormik.touched.email && securityFormik.errors.email && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.email}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                                {t('auth.current_password')}
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                {...securityFormik.getFieldProps('currentPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                            />
                            {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.currentPassword}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                                {t('auth.new_password')}
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                {...securityFormik.getFieldProps('newPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                            />
                            {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.newPassword}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                {t('auth.confirm_password')}
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                {...securityFormik.getFieldProps('confirmPassword')}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-white"
                            />
                            {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">{securityFormik.errors.confirmPassword}</p>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isUpdatingSecurity || (!securityFormik.values.currentPassword && !securityFormik.values.newPassword && securityFormik.values.email === user?.credentials?.email)}
                                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
                            >
                                {isUpdatingSecurity ? t('common.updating') : t('common.save')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}; 