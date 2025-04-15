import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { tutorService, getErrorMessage } from '../services/api';
import { TutorAvailability, TutorAvailabilityRequest } from '../types/tutor';
import { UserRole } from '../types';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { CalendarIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import classNames from 'classnames';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const formatTime = (timeString: string) => {
  if (!timeString) return '';
  
  // For ISO datetime format: '0000-01-01T12:00:00Z'
  if (timeString.includes('T')) {
    try {
      // Extract just the time part (HH:MM) from the ISO string
      const timePart = timeString.split('T')[1];
      // Take just HH:MM from HH:MM:SSZ
      const timeOnly = timePart.substring(0, 5);
      return timeOnly;
    } catch (error) {
      console.error("Error extracting time:", error);
      return timeString;
    }
  }
  
  // For regular time format: 'HH:MM' or 'HH:MM:SS'
  if (timeString.includes(':')) {
    try {
      // Just return HH:MM part
      return timeString.substring(0, 5);
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeString;
    }
  }
  
  return timeString;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  
  // Handle ISO strings (with time and timezone) as well as date-only strings
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Use the browser's locale for date formatting
  const options: Intl.DateTimeFormatOptions = { 
    day: "2-digit", 
    month: "long", 
    year: "numeric"
  };
  
  return date.toLocaleDateString(undefined, options);
};

type FormData = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date?: string;
};

// For debugging time-related issues
const examineTimeFormat = (availabilities: TutorAvailability[]) => {
  if (!availabilities?.length) return;
  
  console.group('Examining availability time formats');
  const firstItem = availabilities[0];
  console.log('Sample availability:', firstItem);
  
  if (firstItem.start_time) {
    console.log('Start time:', firstItem.start_time);
    console.log('Start time type:', typeof firstItem.start_time);
    console.log('Start time length:', firstItem.start_time.length);
    if (firstItem.start_time.includes(':')) {
      console.log('Appears to be in time format HH:MM or HH:MM:SS');
    } else if (firstItem.start_time.includes('T')) {
      console.log('Appears to be in ISO datetime format');
    } else {
      console.log('Unknown time format');
    }
  }
  
  console.groupEnd();
};

export const TutorSchedule: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availabilities, setAvailabilities] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isRecurring, setIsRecurring] = useState(true);
  const initializedRef = useRef(false);
  const effectRanRef = useRef(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:00',
      is_recurring: true,
    }
  });

  const watchIsRecurring = watch('is_recurring');

  // Modify fetchAvailabilities to examine time formats
  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getTutorAvailabilities();
      console.log('Fetched availabilities data:', JSON.stringify(data, null, 2));
      
      // Make sure we have valid data
      if (Array.isArray(data)) {
        // Examine time formats for debugging
        examineTimeFormat(data);
        
        setAvailabilities(data);
      } else {
        console.error('Invalid availabilities data format:', data);
        setAvailabilities([]);
      }
    } catch (error) {
      console.error('Failed to fetch availabilities:', error);
      // Don't use toast here to avoid circular dependencies
      setAvailabilities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only run once
    if (!effectRanRef.current && user) {
      effectRanRef.current = true;
      
      if (user.role === UserRole.TUTOR) {
        initializedRef.current = true;
        fetchAvailabilities();
      } else {
        // Redirect non-tutors
        navigate('/');
        toast.error(t('pages.tutor_schedule.not_tutor_message'));
      }
    }
  }, [user, navigate, t]);

  const onSubmit = async (data: FormData) => {
    try {
      const availabilityData: TutorAvailabilityRequest = {
        day_of_week: data.day_of_week,
        start_time: data.start_time,
        end_time: data.end_time,
        is_recurring: data.is_recurring,
        specific_date: data.is_recurring ? undefined : data.specific_date,
      };

      if (isEditing && editingId) {
        await tutorService.updateTutorAvailability(editingId, availabilityData);
        toast.success(t('pages.tutor_schedule.update_success'));
      } else {
        await tutorService.addTutorAvailability(availabilityData);
        toast.success(t('pages.tutor_schedule.add_success'));
      }

      // Fetch the updated list of availabilities
      await fetchAvailabilities();
      
      reset();
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      console.error('Failed to save availability:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleEdit = (availability: TutorAvailability) => {
    setIsEditing(true);
    setEditingId(availability.id);
    setIsRecurring(availability.is_recurring);
    
    setValue('day_of_week', availability.day_of_week);
    setValue('start_time', availability.start_time);
    setValue('end_time', availability.end_time);
    setValue('is_recurring', availability.is_recurring);
    
    if (availability.specific_date) {
      setValue('specific_date', availability.specific_date);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('pages.tutor_schedule.confirm_delete'))) {
      try {
        await tutorService.deleteTutorAvailability(id);
        toast.success(t('pages.tutor_schedule.delete_success'));
        
        // Fetch the updated list of availabilities
        await fetchAvailabilities();
      } catch (error) {
        console.error('Failed to delete availability:', error);
        toast.error(getErrorMessage(error));
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingId(null);
    reset();
  };

  // Group availabilities by recurring and specific dates
  const recurringAvailabilities = availabilities?.filter(a => a.is_recurring) || [];
  const specificDateAvailabilities = availabilities?.filter(a => !a.is_recurring) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('pages.tutor_schedule.title')}</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing 
              ? t('pages.tutor_schedule.edit_availability') 
              : t('pages.tutor_schedule.add_availability')}
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center space-x-4 mb-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  checked={watchIsRecurring}
                  onChange={() => setValue('is_recurring', true)}
                />
                <span className="ml-2">{t('pages.tutor_schedule.recurring')}</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio"
                  checked={!watchIsRecurring}
                  onChange={() => setValue('is_recurring', false)}
                />
                <span className="ml-2">{t('pages.tutor_schedule.specific_date')}</span>
              </label>
            </div>
            
            {watchIsRecurring ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.tutor_schedule.day_of_week')}
                </label>
                <Controller
                  name="day_of_week"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }: { field: ControllerRenderProps<FormData, 'day_of_week'> }) => (
                    <Select
                      {...field}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.onChange(parseInt(e.target.value, 10))}
                      value={field.value.toString()}
                      className="mt-1 block w-full"
                      error={errors.day_of_week ? t('common.error.required') : ''}
                    >
                      {DAYS_OF_WEEK.map((day) => (
                        <option key={day.value} value={day.value}>
                          {t(`common.days.${day.label.toLowerCase()}`)}
                        </option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.tutor_schedule.specific_date')}
                </label>
                <Controller
                  name="specific_date"
                  control={control}
                  rules={{ required: !watchIsRecurring }}
                  render={({ field }: { field: ControllerRenderProps<FormData, 'specific_date'> }) => (
                    <div className="mt-1 relative">
                      <input
                        {...field}
                        type="date"
                        className={classNames(
                          "block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                          { "border-red-500": errors.specific_date }
                        )}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.specific_date && (
                        <p className="mt-1 text-sm text-red-600">
                          {t('common.error.required')}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.tutor_schedule.start_time')}
                </label>
                <Controller
                  name="start_time"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }: { field: ControllerRenderProps<FormData, 'start_time'> }) => (
                    <input
                      {...field}
                      type="time"
                      className={classNames(
                        "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                        { "border-red-500": errors.start_time }
                      )}
                    />
                  )}
                />
                {errors.start_time && (
                  <p className="mt-1 text-sm text-red-600">{t('common.error.required')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t('pages.tutor_schedule.end_time')}
                </label>
                <Controller
                  name="end_time"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }: { field: ControllerRenderProps<FormData, 'end_time'> }) => (
                    <input
                      {...field}
                      type="time"
                      className={classNames(
                        "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",
                        { "border-red-500": errors.end_time }
                      )}
                    />
                  )}
                />
                {errors.end_time && (
                  <p className="mt-1 text-sm text-red-600">{t('common.error.required')}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4 pt-4">
              {isEditing && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                >
                  {t('common.cancel')}
                </Button>
              )}
              <Button 
                type="submit" 
                variant="primary"
                className="flex items-center"
              >
                {isEditing ? (
                  <span>{t('common.update')}</span>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-1" />
                    <span>{t('common.add')}</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
        
        {/* Availability display section */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('pages.tutor_schedule.recurring_availabilities')}
            </h2>
            
            {loading ? (
              <p>{t('common.loading')}...</p>
            ) : recurringAvailabilities.length > 0 ? (
              <div className="space-y-4">
                {recurringAvailabilities.map((availability) => (
                  <div 
                    key={availability.id} 
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">
                        {t(`common.days.${DAYS_OF_WEEK.find(d => d.value === availability.day_of_week)?.label.toLowerCase()}`)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
                      </p>
                      {/*  
                      <p className="text-xs text-gray-400">
                        Raw: {availability.start_time} - {availability.end_time}
                      </p>*/}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(availability)}
                        className="p-1 rounded-md text-orange-600 hover:bg-orange-100"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(availability.id)}
                        className="p-1 rounded-md text-red-600 hover:bg-red-100"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {t('pages.tutor_schedule.no_recurring_availabilities')}
              </p>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t('pages.tutor_schedule.specific_date_availabilities')}
            </h2>
            
            {loading ? (
              <p>{t('common.loading')}...</p>
            ) : specificDateAvailabilities.length > 0 ? (
              <div className="space-y-4">
                {specificDateAvailabilities.map((availability) => (
                  <div 
                    key={availability.id} 
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {formatDate(availability.specific_date || '')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(availability.start_time)} - {formatTime(availability.end_time)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(availability)}
                        className="p-1 rounded-md text-orange-600 hover:bg-orange-100"
                        title={t('common.edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(availability.id)}
                        className="p-1 rounded-md text-red-600 hover:bg-red-100"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                {t('pages.tutor_schedule.no_specific_availabilities')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 