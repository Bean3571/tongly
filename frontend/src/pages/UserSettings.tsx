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
    const [isLoading, setIsLoading] = useState(true);
    
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
        
        // Try directly on user object (backend might return fields at root level)
        if (user[field as keyof typeof user] !== undefined) {
            return String(user[field as keyof typeof user] || defaultValue);
        }
        
        return defaultValue;
    };

    // Initialize user info state
    const [userInfo, setUserInfo] = useState({
        firstName: '',
        lastName: '',
        userPicture: '',
        age: '',
        sex: '',
        email: '',
        username: '',
    });

    // Update local state when user data changes
    useEffect(() => {
        if (user) {
            setUserInfo({
                firstName: getUserField('first_name'),
                lastName: getUserField('last_name'),
                userPicture: getUserField('profile_picture') || getUserField('profile_picture_url'),
                age: getUserField('age'),
                sex: getUserField('sex'),
                email: user.credentials?.email || getUserField('email'),
                username: user.credentials?.username || getUserField('username'),
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
                
                await api.user.updateProfile({
                    first_name: values.firstName || null,
                    last_name: values.lastName || null,
                    profile_picture: values.userPicture || null,
                    age: values.age ? parseInt(values.age) : null,
                    sex: values.sex ? values.sex === 'not_set' ? null : (values.sex as 'male' | 'female') : null,
                });
                await loadUserData();
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
            email: userInfo.email || '',
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
                let hasUpdates = false;
                
                // Track if we actually made changes
                let emailUpdated = false;
                let passwordUpdated = false;
                
                // Update email if changed and not empty
                if (values.email && values.email !== (user?.credentials?.email || userInfo.email)) {
                    console.log("Updating email from:", user?.credentials?.email || userInfo.email, "to:", values.email);
                    await api.user.updateProfile({ email: values.email });
                    emailUpdated = true;
                    hasUpdates = true;
                }
                
                // Update password if provided
                if (values.currentPassword && values.newPassword) {
                    console.log("Attempting to update password");
                    try {
                        await api.user.updatePassword(
                            values.currentPassword,
                            values.newPassword
                        );
                        console.log("Password update API call successful");
                        passwordUpdated = true;
                        hasUpdates = true;
                    } catch (passwordError: any) {
                        console.error("Password update failed with error:", passwordError);
                        // Show specific error for password update
                        const errorMessage = 
                            passwordError.response?.data?.error || 
                            "Failed to update password. Please check your current password and try again.";
                        showNotification('error', errorMessage);
                        throw passwordError; // Re-throw to prevent other updates
                    }
                }
                
                if (hasUpdates) {
                    await loadUserData();
                    
                    // Determine appropriate success message
                    let message = '';
                    if (emailUpdated && passwordUpdated) {
                        message = t('notifications.email_and_password_updated');
                    } else if (emailUpdated) {
                        message = t('notifications.email_updated');
                    } else if (passwordUpdated) {
                        message = t('notifications.password_updated');
                    } else {
                        message = t('notifications.security_settings_updated');
                    }
                    
                    showNotification('success', message);
                    
                    // Reset only password fields
                    securityFormik.setFieldValue('currentPassword', '');
                    securityFormik.setFieldValue('newPassword', '');
                    securityFormik.setFieldValue('confirmPassword', '');
                } else {
                    showNotification('info', t('notifications.no_changes_made'));
                }
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
            setIsLoading(true);
            
            // First refresh from Auth context
            await refreshUser();
            
            // Then directly get profile data from API
            const profileData = await api.user.getProfile();
            
            if (profileData) {
                // Handle different API response structures
                // This will adapt to the backend's actual data structure
                const extractedEmail = profileData.credentials?.email || 
                                      (profileData as any).email || 
                                      '';
                
                const extractedUsername = profileData.credentials?.username || 
                                         (profileData as any).username || 
                                         '';
                
                console.log("API Profile data received:", {
                    email: extractedEmail,
                    username: extractedUsername,
                    rawData: JSON.stringify(profileData)
                });
                
                // Update securityFormik with email
                securityFormik.setFieldValue('email', extractedEmail);
                
                // Update userInfo state with the latest data
                setUserInfo(prevState => ({
                    ...prevState,
                    email: extractedEmail,
                    username: extractedUsername
                }));
                
                // If we don't have credentials in the user object from context
                // but have them directly in the API response, create a local patched user
                if ((!user?.credentials || user.credentials.username === 'unknown') && 
                    ((profileData as any).username || (profileData as any).email)) {
                    
                    // Log what we're doing for debugging
                    console.log("Creating patched user credentials from API response", {
                        id: (profileData as any).id,
                        username: (profileData as any).username,
                        email: (profileData as any).email,
                        role: (profileData as any).role
                    });
                    
                    // Since we can't update the user context directly from here,
                    // we need to refresh the entire auth context after fixing our data mapping
                    if (typeof refreshUser === 'function') {
                        await refreshUser();
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
            showNotification('error', t('notifications.user_data_fetch_failed'));
        } finally {
            setIsLoading(false);
        }
    };

    // Load user data when component mounts
    useEffect(() => {
        loadUserData();
    }, []);

    // Update security form email when user email changes
    useEffect(() => {
        if (user?.credentials?.email) {
            securityFormik.setFieldValue('email', user.credentials.email);
        }
    }, [user?.credentials?.email]);

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
            return userInfo.username || user?.credentials?.username || t('common.user');
        }
    };

    // Display loading state
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 bg-white flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-600 mb-4"></div>
                    <p className="text-gray-600">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    // Display current values or loading state
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 bg-white flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-600">{t('userSettings.no_user_data')}</p>
                    <button 
                        onClick={loadUserData}
                        className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        {t('common.retry')}
                    </button>
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
                                value={userInfo.username || user?.credentials?.username || ""}
                                disabled       
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 bg-gray-100 text-gray-500 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-500">{t('userSettings.username_note')}</p>
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
                                disabled={isUpdatingSecurity || (!securityFormik.values.currentPassword && !securityFormik.values.newPassword && !securityFormik.dirty)}
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