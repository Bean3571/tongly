import React, { useEffect, useState } from 'react';
import { useFormik, FieldArray, FormikProvider, FormikErrors } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { tutorService, getErrorMessage } from '../services/api';
import { TutorProfile, Education, TutorUpdateRequest } from '../types/tutor';

// Helper function to safely get error message
const getFieldError = (errors: any, fieldPath: string): string => {
  if (!errors) return '';
  
  const path = fieldPath.split('.');
  let current = errors;
  
  for (const key of path) {
    if (!current[key]) return '';
    current = current[key];
  }
  
  return current?.toString() || '';
};

// Type guard to check if an education error is a FormikErrors object and not a string
const isEducationError = (error: string | FormikErrors<Education>): error is FormikErrors<Education> => {
  return typeof error !== 'string';
};

export const TutorSettings = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tutor profile on component mount
  useEffect(() => {
    const fetchTutorProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await tutorService.getTutorProfile();
        setTutorProfile(profile);
      } catch (error) {
        console.error('Failed to fetch tutor profile:', error);
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'tutor') {
      fetchTutorProfile();
    }
  }, [user]);

  const emptyEducation: Education = {
    degree: '',
    institution: '',
    field_of_study: '',
    start_year: '',
    end_year: '',
  };

  const formik = useFormik({
    initialValues: {
      bio: tutorProfile?.bio || '',
      education: tutorProfile?.education || [emptyEducation],
      intro_video_url: tutorProfile?.intro_video_url || '',
      years_experience: tutorProfile?.years_experience || 0,
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      bio: Yup.string().required(t('validation.required')),
      education: Yup.array().of(
        Yup.object().shape({
          degree: Yup.string().required(t('validation.required')),
          institution: Yup.string().required(t('validation.required')),
          field_of_study: Yup.string().required(t('validation.required')),
          start_year: Yup.string().required(t('validation.required')),
          end_year: Yup.string().required(t('validation.required')),
          documentUrl: Yup.string().url(t('validation.url_invalid')).nullable(),
        })
      ),
      intro_video_url: Yup.string().url(t('validation.url_invalid')).nullable(),
      years_experience: Yup.number()
        .required(t('validation.required'))
        .min(0, t('validation.years_experience_min'))
        .max(100, t('validation.years_experience_max')),
    }),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);
        setError(null);
        setUpdateSuccess(false);

        // Make sure we have at least one education entry for submission
        const education = values.education && values.education.length > 0 
          ? values.education 
          : [emptyEducation];

        const updateData: TutorUpdateRequest = {
          bio: values.bio,
          education: education,
          intro_video_url: values.intro_video_url || undefined,
          years_experience: values.years_experience,
        };

        const updatedProfile = await tutorService.updateTutorProfile(updateData);
        setTutorProfile(updatedProfile);
        setUpdateSuccess(true);
      } catch (error: any) {
        console.error('Update tutor profile error:', error);
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
  });

  if (!user || user.role !== 'tutor') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">{t('pages.tutor_settings.title')}</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-600">
          {t('pages.tutor_settings.not_tutor_message')}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('pages.tutor_settings.title')}</h1>

      {/* Loading state */}
      {isLoading && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-md p-4 text-sm text-orange-600">
          {t('common.loading')}
        </div>
      )}

      {/* Success message */}
      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-600">
          {t('pages.tutor_settings.update_success')}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            {/* Bio */}
            <div className="mb-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tutor.bio')}
              </label>
              <textarea
                id="bio"
                {...formik.getFieldProps('bio')}
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder={t('pages.tutor_settings.bio_placeholder')}
              />
              {formik.touched.bio && formik.errors.bio && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.bio as string}</p>
              )}
            </div>

            {/* Years of Experience */}
            <div className="mb-6">
              <label htmlFor="years_experience" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tutor.years_experience')}
              </label>
              <input
                id="years_experience"
                type="number"
                {...formik.getFieldProps('years_experience')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                min="0"
                max="100"
              />
              {formik.touched.years_experience && formik.errors.years_experience && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.years_experience as string}</p>
              )}
            </div>

            {/* Intro Video URL */}
            <div className="mb-6">
              <label htmlFor="intro_video_url" className="block text-sm font-medium text-gray-700 mb-1">
                {t('tutor.intro_video_url')}
              </label>
              <input
                id="intro_video_url"
                type="url"
                {...formik.getFieldProps('intro_video_url')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                placeholder={t('pages.tutor_settings.video_url_placeholder')}
              />
              {formik.touched.intro_video_url && formik.errors.intro_video_url && (
                <p className="mt-1 text-sm text-red-600">{formik.errors.intro_video_url as string}</p>
              )}
              {formik.values.intro_video_url && (
                <div className="mt-2 aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={formik.values.intro_video_url}
                    title="Intro Video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>

            {/* Education */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('tutor.education')}
              </label>
              <FieldArray
                name="education"
                render={arrayHelpers => (
                  <div>
                    {formik.values.education.map((education, index) => (
                      <div key={index} className="mb-6 p-4 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-md font-medium">{t('tutor.education')} #{index + 1}</h3>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(t('pages.tutor_settings.confirm_remove_education'))) {
                                // Always remove the education entry
                                arrayHelpers.remove(index);
                              }
                            }}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {t('common.remove')}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Degree */}
                          <div>
                            <label htmlFor={`education.${index}.degree`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_degree')}
                            </label>
                            <input
                              id={`education.${index}.degree`}
                              type="text"
                              {...formik.getFieldProps(`education.${index}.degree`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            {formik.touched.education?.[index]?.degree && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).degree && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.degree`)}
                              </p>
                            )}
                          </div>

                          {/* Institution */}
                          <div>
                            <label htmlFor={`education.${index}.institution`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_institution')}
                            </label>
                            <input
                              id={`education.${index}.institution`}
                              type="text"
                              {...formik.getFieldProps(`education.${index}.institution`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            {formik.touched.education?.[index]?.institution && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).institution && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.institution`)}
                              </p>
                            )}
                          </div>

                          {/* Field of Study */}
                          <div>
                            <label htmlFor={`education.${index}.field_of_study`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_field')}
                            </label>
                            <input
                              id={`education.${index}.field_of_study`}
                              type="text"
                              {...formik.getFieldProps(`education.${index}.field_of_study`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            {formik.touched.education?.[index]?.field_of_study && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).field_of_study && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.field_of_study`)}
                              </p>
                            )}
                          </div>

                          {/* Start Year */}
                          <div>
                            <label htmlFor={`education.${index}.start_year`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_start_year')}
                            </label>
                            <input
                              id={`education.${index}.start_year`}
                              type="text"
                              {...formik.getFieldProps(`education.${index}.start_year`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            {formik.touched.education?.[index]?.start_year && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).start_year && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.start_year`)}
                              </p>
                            )}
                          </div>

                          {/* End Year */}
                          <div>
                            <label htmlFor={`education.${index}.end_year`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_end_year')}
                            </label>
                            <input
                              id={`education.${index}.end_year`}
                              type="text"
                              {...formik.getFieldProps(`education.${index}.end_year`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                            />
                            {formik.touched.education?.[index]?.end_year && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).end_year && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.end_year`)}
                              </p>
                            )}
                          </div>

                          {/* Document URL */}
                          <div className="md:col-span-2">
                            <label htmlFor={`education.${index}.documentUrl`} className="block text-sm font-medium text-gray-700 mb-1">
                              {t('tutor.education_document')} ({t('common.optional')})
                            </label>
                            <input
                              id={`education.${index}.documentUrl`}
                              type="url"
                              {...formik.getFieldProps(`education.${index}.documentUrl`)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                              placeholder={t('pages.tutor_settings.document_url_placeholder')}
                            />
                            {formik.touched.education?.[index]?.documentUrl && 
                             formik.errors.education?.[index] && 
                             isEducationError(formik.errors.education[index]) && 
                             (formik.errors.education[index] as FormikErrors<Education>).documentUrl && (
                              <p className="mt-1 text-sm text-red-600">
                                {getFieldError(formik.errors, `education.${index}.documentUrl`)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => arrayHelpers.push(emptyEducation)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                      >
                        {t('pages.tutor_settings.add_education')}
                      </button>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  isLoading ? 'bg-gray-400' : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
                }`}
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </FormikProvider>
      </div>
    </div>
  );
}; 