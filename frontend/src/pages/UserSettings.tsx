import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { UserUpdateRequest } from '../types';
import { userService, getErrorMessage } from '../services/api';
import { envConfig } from '../config/env';

export const UserSettings = () => {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personalInfoFormik = useFormik({
    initialValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      profile_picture_url: user?.profile_picture_url || '',
      sex: user?.sex || 'не выбран',
      age: user?.age || '',
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required(t('validation.required')),
      last_name: Yup.string().required(t('validation.required')),
      profile_picture_url: Yup.string().url(t('validation.url_invalid')).nullable(),
      sex: Yup.string().oneOf(['мужской', 'женский', 'не выбран'], t('validation.sex_invalid')),
      age: Yup.number().nullable().min(18, t('validation.age_min')).max(120, t('validation.age_max')),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);
        setUpdateSuccess(false);
        
        const updateData: UserUpdateRequest = {
          first_name: values.first_name,
          last_name: values.last_name,
          profile_picture_url: values.profile_picture_url,
          sex: values.sex,
          age: values.age ? Number(values.age) : null,
        };
        
        const updatedUser = await userService.updateProfile(updateData);
        setUser(updatedUser);
        setUpdateSuccess(true);
      } catch (error: any) {
        console.error('Update profile error:', error);
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
  });

  const securityFormik = useFormik({
    initialValues: {
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email(t('validation.email_invalid')).required(t('validation.required')),
      currentPassword: Yup.string().min(6, t('validation.password_min_length')),
      newPassword: Yup.string().min(6, t('validation.password_min_length')),
      confirmPassword: Yup.string().oneOf([Yup.ref('newPassword')], t('validation.password_match')),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);
        setUpdateSuccess(false);
        
        // Update email if changed
        if (values.email !== user?.email) {
          const updateData: UserUpdateRequest = {
            email: values.email,
          };
          const updatedUser = await userService.updateProfile(updateData);
          setUser(updatedUser);
        }
        
        // Update password if provided
        if (values.currentPassword && values.newPassword) {
          await userService.updatePassword(values.currentPassword, values.newPassword);
        }
        
        setUpdateSuccess(true);
        securityFormik.resetForm({
          values: {
            email: values.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          }
        });
      } catch (error: any) {
        console.error('Update security info error:', error);
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Update form values when user changes
  useEffect(() => {
    if (user) {
      personalInfoFormik.setValues({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        profile_picture_url: user.profile_picture_url || '',
        sex: user.sex || 'не выбран',
        age: user.age || '',
      });
      
      securityFormik.setValues({
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    target.src = envConfig.placeholderImage;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('pages.user_settings.title')}</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('personal')}
            className={`${
              activeTab === 'personal'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-6 font-medium text-sm border-b-2 focus:outline-none`}
          >
            {t('pages.user_settings.personal_tab')}
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`${
              activeTab === 'security'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-6 font-medium text-sm border-b-2 focus:outline-none`}
          >
            {t('pages.user_settings.security_tab')}
          </button>
        </nav>
      </div>
      
      {/* Success message */}
      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-600">
          {t('pages.user_settings.update_success')}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Personal Information Form */}
      {activeTab === 'personal' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('pages.user_settings.personal_info')}</h2>
          <form onSubmit={personalInfoFormik.handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  {t('user.first_name')}
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...personalInfoFormik.getFieldProps('first_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                {personalInfoFormik.touched.first_name && personalInfoFormik.errors.first_name && (
                  <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.first_name}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  {t('user.last_name')}
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...personalInfoFormik.getFieldProps('last_name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                {personalInfoFormik.touched.last_name && personalInfoFormik.errors.last_name && (
                  <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.last_name}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="profile_picture_url" className="block text-sm font-medium text-gray-700">
                  {t('user.profile_picture')}
                </label>
                <input
                  id="profile_picture_url"
                  type="text"
                  {...personalInfoFormik.getFieldProps('profile_picture_url')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  placeholder={t('pages.user_settings.profile_picture_placeholder')}
                />
                {personalInfoFormik.touched.profile_picture_url && personalInfoFormik.errors.profile_picture_url && (
                  <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.profile_picture_url}</p>
                )}
                
                {personalInfoFormik.values.profile_picture_url && (
                  <div className="mt-2">
                    <img 
                      src={personalInfoFormik.values.profile_picture_url} 
                      alt={t('user.profile_picture')} 
                      className="h-20 w-20 rounded-full object-cover"
                      onError={handleImageError}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                  {t('userSettings.fields.gender')}
                </label>
                <select
                  id="sex"
                  {...personalInfoFormik.getFieldProps('sex')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                >
                  <option value="не выбран">{t('common.not_specified')}</option>
                  <option value="мужской">{t('common.male')}</option>
                  <option value="женский">{t('common.female')}</option>
                </select>
                {personalInfoFormik.touched.sex && personalInfoFormik.errors.sex && (
                  <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.sex}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                  {t('userSettings.fields.age')}
                </label>
                <input
                  id="age"
                  type="number"
                  {...personalInfoFormik.getFieldProps('age')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                />
                {personalInfoFormik.touched.age && personalInfoFormik.errors.age && (
                  <p className="mt-1 text-sm text-red-600">{personalInfoFormik.errors.age}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!personalInfoFormik.isValid || personalInfoFormik.isSubmitting || isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Security Form */}
      {activeTab === 'security' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">{t('pages.user_settings.security')}</h2>
          <form onSubmit={securityFormik.handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('user.username')}
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{t('userSettings.username_note')}</p>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    {t('user.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...securityFormik.getFieldProps('email')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  />
                  {securityFormik.touched.email && securityFormik.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{securityFormik.errors.email}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{t('user.change_password')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                      {t('user.current_password')}
                    </label>
                    <input
                      id="currentPassword"
                      type="password"
                      {...securityFormik.getFieldProps('currentPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                    {securityFormik.touched.currentPassword && securityFormik.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{securityFormik.errors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      {t('user.new_password')}
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      {...securityFormik.getFieldProps('newPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                    {securityFormik.touched.newPassword && securityFormik.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{securityFormik.errors.newPassword}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      {t('user.confirm_password')}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      {...securityFormik.getFieldProps('confirmPassword')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                    />
                    {securityFormik.touched.confirmPassword && securityFormik.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{securityFormik.errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={!securityFormik.isValid || securityFormik.isSubmitting || isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserSettings; 