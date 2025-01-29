import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { TutorRegistrationData, TutorLanguage, SchedulePreset, AvailabilitySlot } from '../types';
import { api } from '../api/client';
import LanguageSelector from '../components/LanguageSelector';
import ScheduleBuilder from '../components/ScheduleBuilder';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SCHEDULE_PRESETS: { [key in SchedulePreset]: { label: string; description: string } } = {
    weekdays: { label: 'Weekdays', description: 'Monday to Friday, 9 AM - 5 PM' },
    weekends: { label: 'Weekends', description: 'Saturday and Sunday, 10 AM - 6 PM' },
    all_week: { label: 'All Week', description: 'Every day, 9 AM - 5 PM' },
    mornings: { label: 'Mornings', description: 'Every day, 7 AM - 12 PM' },
    evenings: { label: 'Evenings', description: 'Every day, 5 PM - 10 PM' },
    custom: { label: 'Custom Schedule', description: 'Set your own schedule' }
};

export const TutorRegistration = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<TutorRegistrationData>({
        bio: '',
        education: [''],
        certificates: [],
        teaching_experience: '',
        hourly_rate: 20,
        schedule_preset: 'weekdays',
        min_lesson_duration: 30,
        max_students: 1,
        trial_lesson_available: true,
        trial_lesson_price: undefined,
        languages: [],
        availability: []
    });

    const handleNext = () => {
        if (validateCurrentStep()) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const validateCurrentStep = () => {
        switch (step) {
            case 1: // Basic Info
                if (!formData.bio.trim()) {
                    showNotification('error', 'Please provide a bio');
                    return false;
                }
                if (!formData.education[0]) {
                    showNotification('error', 'Please provide at least one education entry');
                    return false;
                }
                return true;

            case 2: // Languages
                if (formData.languages.length === 0) {
                    showNotification('error', 'Please add at least one language');
                    return false;
                }
                return true;

            case 3: // Schedule
                if (formData.schedule_preset === 'custom' && formData.availability.length === 0) {
                    showNotification('error', 'Please set your availability');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        try {
            await api.tutor.register(formData);
            showNotification('success', 'Successfully registered as a tutor!');
            navigate('/tutor/profile');
        } catch (error) {
            console.error('Failed to register as tutor:', error);
            showNotification('error', 'Failed to register as tutor. Please try again.');
        }
    };

    const addEducation = () => {
        setFormData({
            ...formData,
            education: [...formData.education, '']
        });
    };

    const updateEducation = (index: number, value: string) => {
        const newEducation = [...formData.education];
        newEducation[index] = value;
        setFormData({
            ...formData,
            education: newEducation
        });
    };

    const removeEducation = (index: number) => {
        setFormData({
            ...formData,
            education: formData.education.filter((_, i) => i !== index)
        });
    };

    const addLanguage = (language: TutorLanguage) => {
        setFormData({
            ...formData,
            languages: [...formData.languages, language]
        });
    };

    const removeLanguage = (language: string) => {
        setFormData({
            ...formData,
            languages: formData.languages.filter(l => l.language !== language)
        });
    };

    const handleSchedulePresetChange = (preset: SchedulePreset) => {
        setFormData({
            ...formData,
            schedule_preset: preset,
            availability: preset === 'custom' ? [] : generateAvailabilityFromPreset(preset)
        });
    };

    const generateAvailabilityFromPreset = (preset: SchedulePreset): AvailabilitySlot[] => {
        switch (preset) {
            case 'weekdays':
                return [1, 2, 3, 4, 5].map(day => ({
                    day_of_week: day,
                    start_time: '09:00',
                    end_time: '17:00',
                    is_recurring: true,
                    preset_type: preset
                }));
            case 'weekends':
                return [0, 6].map(day => ({
                    day_of_week: day,
                    start_time: '10:00',
                    end_time: '18:00',
                    is_recurring: true,
                    preset_type: preset
                }));
            // Add other cases as needed
            default:
                return [];
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Bio
                            </label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                         focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Tell students about yourself and your teaching experience..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Education
                            </label>
                            {formData.education.map((edu, index) => (
                                <div key={index} className="flex mt-2">
                                    <input
                                        type="text"
                                        value={edu}
                                        onChange={(e) => updateEducation(index, e.target.value)}
                                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                                 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                        placeholder="Degree, Institution, Year"
                                    />
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEducation(index)}
                                            className="ml-2 text-red-600 hover:text-red-800"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addEducation}
                                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                                + Add Education
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Teaching Experience
                            </label>
                            <textarea
                                value={formData.teaching_experience}
                                onChange={(e) => setFormData({ ...formData, teaching_experience: e.target.value })}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                         focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Describe your teaching experience..."
                            />
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Languages You Can Teach
                            </label>
                            <div className="mt-2">
                                <LanguageSelector
                                    languages={formData.languages}
                                    onChange={(languages) => setFormData({ ...formData, languages })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Hourly Rate (USD)
                            </label>
                            <input
                                type="number"
                                value={formData.hourly_rate}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
                                min="1"
                                step="0.5"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                         focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Trial Lesson
                            </label>
                            <div className="mt-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.trial_lesson_available}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            trial_lesson_available: e.target.checked 
                                        })}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 
                                                 focus:ring-blue-500"
                                    />
                                    <span className="ml-2">Offer trial lessons</span>
                                </label>
                            </div>
                            {formData.trial_lesson_available && (
                                <div className="mt-2">
                                    <label className="block text-sm text-gray-700 dark:text-gray-300">
                                        Trial Lesson Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.trial_lesson_price || ''}
                                        onChange={(e) => setFormData({ 
                                            ...formData, 
                                            trial_lesson_price: Number(e.target.value) 
                                        })}
                                        min="0"
                                        step="0.5"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
                                                 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 
                                                 dark:border-gray-600"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Schedule Preset
                            </label>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(SCHEDULE_PRESETS).map(([key, { label, description }]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleSchedulePresetChange(key as SchedulePreset)}
                                        className={`p-4 border rounded-lg text-left ${
                                            formData.schedule_preset === key
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <div className="font-medium">{label}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.schedule_preset === 'custom' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Custom Schedule
                                </label>
                                <div className="mt-2">
                                    <ScheduleBuilder
                                        availability={formData.availability}
                                        onChange={(availability) => setFormData({ ...formData, availability })}
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Lesson Duration
                            </label>
                            <select
                                value={formData.min_lesson_duration}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    min_lesson_duration: Number(e.target.value) 
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                         focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value={30}>30 minutes</option>
                                <option value={45}>45 minutes</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Maximum Students per Lesson
                            </label>
                            <select
                                value={formData.max_students}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    max_students: Number(e.target.value) 
                                })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 
                                         focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                            >
                                <option value={1}>1 (Individual lessons only)</option>
                                <option value={2}>Up to 2 students</option>
                                <option value={3}>Up to 3 students</option>
                                <option value={4}>Up to 4 students</option>
                                <option value={5}>Up to 5 students</option>
                            </select>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Become a Tutor
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {step === 1 ? 'Tell us about yourself' :
                         step === 2 ? 'What can you teach?' :
                         'Set your availability'}
                    </p>
                </div>

                <div className="mb-8 flex justify-center">
                    <div className="flex items-center">
                        {[1, 2, 3].map((s) => (
                            <React.Fragment key={s}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    s === step
                                        ? 'bg-blue-600 text-white'
                                        : s < step
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                    {s < step ? '✓' : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-12 h-1 ${
                                        s < step
                                            ? 'bg-green-500'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {renderStep()}

                <div className="mt-8 flex justify-between">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={handleBack}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium 
                                     text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                                     focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 
                                     dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Back
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={step < 3 ? handleNext : handleSubmit}
                        className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm 
                                 font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none 
                                 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {step < 3 ? 'Next' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorRegistration; 
