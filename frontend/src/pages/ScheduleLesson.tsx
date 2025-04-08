import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { getTutorProfile, getTutorAvailabilities, bookLesson } from '../services/tutor.service';
import { TutorProfile, TutorAvailability, AvailableTimeSlot } from '../types/tutor';
import { LessonBookingRequest } from '../types/lesson';
import { getAvailableTimeSlots, getAvailableDates, formatDateToString } from '../utils/availability';
import { envConfig } from '../config/env';

// Constants for lesson durations in minutes
const LESSON_DURATIONS = [30, 60, 90];
// Time interval in minutes for the time picker
const TIME_INTERVAL = 15;


// Function to generate embedded video URL
const getYoutubeEmbedUrl = (videoId: string | null) => {
  return videoId ? `${envConfig.youtubeEmbedUrl}/${videoId}` : null;
};

export const ScheduleLesson: React.FC = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State variables
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [availabilities, setAvailabilities] = useState<TutorAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lesson booking state - changed order to match required flow
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(60); // Default 60 minutes
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<AvailableTimeSlot | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Derived state
  const availableDates = getAvailableDates(availabilities);
  const availableTimeSlots = selectedDate 
    ? getAvailableTimeSlots(availabilities, selectedDate)
    : [];

  useEffect(() => {
    const fetchTutorData = async () => {
      if (!tutorId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [tutorData, availabilityData] = await Promise.all([
          getTutorProfile(tutorId),
          getTutorAvailabilities(tutorId)
        ]);
        
        setTutor(tutorData);
        setAvailabilities(availabilityData);
      } catch (err) {
        setError('Failed to load tutor data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTutorData();
  }, [tutorId]);

  // Reset time slot when date or duration changes
  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDate, duration]);

  // Update derived values when dependencies change
  useEffect(() => {
    if (selectedDate && duration) {
      console.log('Recalculating available times for date and duration change');
    }
  }, [selectedDate, duration, availabilities]);

  const formatTime = (date: Date): string => {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid time';
    }
    // Use 24-hour format
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate if a selected duration would exceed the tutor's availability end time
  const isExceedingEndTime = (slot: AvailableTimeSlot, durationMinutes: number): boolean => {
    if (!slot || isNaN(slot.start.getTime()) || isNaN(slot.end.getTime())) {
      return true;
    }
    
    const potentialEndTime = new Date(slot.start.getTime());
    potentialEndTime.setMinutes(potentialEndTime.getMinutes() + durationMinutes);
    
    return potentialEndTime > slot.end;
  };

  // Update duration selection to disable options that would exceed tutor availability
  const handleDurationSelect = (durationOption: number) => {
    if (selectedTimeSlot && isExceedingEndTime(selectedTimeSlot, durationOption)) {
      setSelectedTimeSlot(null);
    }
    setDuration(durationOption);
  };

  // Update the booking function to ensure the end time doesn't exceed availability
  const handleBookLesson = async () => {
    if (!tutorId || !selectedLanguage || !selectedDate || !selectedTimeSlot) {
      return;
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      setBookingStatus('error');
      setError(t('pages.schedule_lesson.login_required'));
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            returnTo: `/schedule/${tutorId}`,
            message: t('pages.schedule_lesson.login_to_book')
          } 
        });
      }, 2000);
      return;
    }
    
    setBookingStatus('loading');
    setError(null);
    
    try {
      // Verify the time slot has valid dates
      if (isNaN(selectedTimeSlot.start.getTime()) || isNaN(selectedTimeSlot.end.getTime())) {
        throw new Error('Invalid date selected');
      }
      
      // Calculate end time based on selected start time and duration
      const startDate = new Date(selectedTimeSlot.start.getTime());
      const endDate = new Date(startDate.getTime());
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      // Ensure end time doesn't exceed tutor's availability end time
      if (endDate > selectedTimeSlot.end) {
        throw new Error('Lesson end time exceeds tutor availability');
      }
      
      const bookingData: LessonBookingRequest = {
        tutor_id: parseInt(tutorId),
        language_id: selectedLanguage,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        notes: notes.trim() || undefined
      };
      
      console.log('Sending booking request with data:', {
        ...bookingData,
        // Show readable times for debugging
        start_time_readable: startDate.toString(),
        end_time_readable: endDate.toString()
      });
      
      await bookLesson(bookingData);
      setBookingStatus('success');
      
      // Reset form
      setSelectedLanguage(null);
      setSelectedDate(null);
      setSelectedTimeSlot(null);
      setDuration(60);
      setNotes('');
      
      // Could navigate to lessons page after successful booking
      setTimeout(() => {
        navigate('/student/lessons');
      }, 2000);
    } catch (err: any) {
      console.error('Booking error:', err);
      setBookingStatus('error');
      
      // Extract and display the actual error message
      if (err.response) {
        const errorData = err.response.data;
        const errorMessage = 
          typeof errorData === 'string' ? errorData :
          errorData?.error ? errorData.error :
          errorData?.message ? errorData.message :
          err.response.statusText;
        
        setError(`${t('pages.schedule_lesson.booking_error')}: ${errorMessage}`);
      } else {
        setError(`${t('pages.schedule_lesson.booking_error')}: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Modified to properly parse and create date objects
  const getFormattedAvailableTimeSlots = (
    availabilities: TutorAvailability[],
    selectedDate: Date
  ): AvailableTimeSlot[] => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dateString = formatDateToString(selectedDate);
    
    // First check if there are any specific dates for this date
    const specificDateAvailabilities = availabilities.filter(a => 
      !a.is_recurring && a.specific_date === dateString
    );
    
    // If there are specific dates, only use those
    if (specificDateAvailabilities.length > 0) {
      return specificDateAvailabilities.map(a => {
        // Parse times more carefully
        const [startHours, startMinutes] = a.start_time.split(':').map(Number);
        const [endHours, endMinutes] = a.end_time.split(':').map(Number);
        
        // Create new date objects for start and end
        const startDate = new Date(selectedDate);
        startDate.setHours(startHours || 0, startMinutes || 0, 0, 0);
        
        const endDate = new Date(selectedDate);
        endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);
        
        return {
          id: a.id,
          start: startDate,
          end: endDate
        };
      });
    }
    
    // Otherwise fall back to recurring availabilities
    const recurringAvailabilities = availabilities.filter(a => 
      a.is_recurring && a.day_of_week === dayOfWeek
    );
    
    return recurringAvailabilities.map(a => {
      // Parse times more carefully
      const [startHours, startMinutes] = a.start_time.split(':').map(Number);
      const [endHours, endMinutes] = a.end_time.split(':').map(Number);
      
      // Create new date objects for start and end
      const startDate = new Date(selectedDate);
      startDate.setHours(startHours || 0, startMinutes || 0, 0, 0);
      
      const endDate = new Date(selectedDate);
      endDate.setHours(endHours || 0, endMinutes || 0, 0, 0);
      
      return {
        id: a.id,
        start: startDate,
        end: endDate
      };
    });
  };

  // Modified to check for at least one available time slot
  const getAvailableDatesList = (availabilities: TutorAvailability[]): Date[] => {
    const result: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dayOfWeek = date.getDay();
      const dateString = formatDateToString(date);
      
      // First check specific dates
      const hasSpecificAvailability = availabilities.some(a => 
        !a.is_recurring && a.specific_date === dateString
      );
      
      if (hasSpecificAvailability) {
        result.push(date);
        continue;
      }
      
      // Then check recurring dates
      const hasRecurringAvailability = availabilities.some(a => 
        a.is_recurring && a.day_of_week === dayOfWeek
      );
      
      if (hasRecurringAvailability) {
        result.push(date);
      }
    }
    
    return result;
  };

  // Use the modified functions
  const availableDatesList = getAvailableDatesList(availabilities);
  const availableTimeSlotsForSelectedDate = selectedDate 
    ? getFormattedAvailableTimeSlots(availabilities, selectedDate)
    : [];

  // Add these new functions
  // Generate time options within tutor's available hours
  const generateTimeOptions = (
    availabilities: TutorAvailability[],
    selectedDate: Date
  ): Date[] => {
    if (!selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dateString = formatDateToString(selectedDate);
    const currentTime = new Date();
    
    console.log('Generating times for date:', dateString, 'day of week:', dayOfWeek);
    console.log('Available slots:', availabilities);
    
    // First check specific dates for this date
    const specificDateSlots = availabilities.filter(a => {
      console.log('Checking specific date match:', a.specific_date, 'vs', dateString);
      return !a.is_recurring && a.specific_date === dateString;
    });
    
    console.log('Specific date slots:', specificDateSlots);
    
    // Check recurring days - note day_of_week might be 1-based or 0-based
    // So we check both possibilities to be safe
    const recurringSlots = availabilities.filter(a => {
      console.log('Checking day of week match:', a.day_of_week, 'vs', dayOfWeek);
      return a.is_recurring && (a.day_of_week === dayOfWeek || a.day_of_week === ((dayOfWeek + 6) % 7 + 1));
    });
    
    console.log('Recurring slots for this day:', recurringSlots);
    
    // Get all relevant availability slots (specific dates take priority)
    const relevantSlots = specificDateSlots.length > 0 
      ? specificDateSlots 
      : recurringSlots;
    
    console.log('Relevant slots to use:', relevantSlots);
    
    if (relevantSlots.length === 0) return [];
    
    const timeOptions: Date[] = [];
    
    // Process each availability slot
    relevantSlots.forEach(slot => {
      console.log('Processing slot:', slot);
      
      // Handle ISO format time strings (format: "0000-01-01T12:06:00Z")
      let startHours, startMinutes, endHours, endMinutes;
      
      if (slot.start_time.includes('T')) {
        // Parse ISO format
        const startDate = new Date(slot.start_time);
        const endDate = new Date(slot.end_time);
        startHours = startDate.getUTCHours();
        startMinutes = startDate.getUTCMinutes();
        endHours = endDate.getUTCHours();
        endMinutes = endDate.getUTCMinutes();
      } else {
        // Parse HH:MM format
        [startHours, startMinutes] = slot.start_time.split(':').map(Number);
        [endHours, endMinutes] = slot.end_time.split(':').map(Number);
      }
      
      console.log('Parsed times:', { startHours, startMinutes, endHours, endMinutes });
      
      // Convert to minutes for easier calculation
      const startTimeMinutes = (startHours * 60) + startMinutes;
      // Subtract duration from end time to ensure lesson fits
      const endTimeMinutes = (endHours * 60) + endMinutes - duration;
      
      console.log('Time range in minutes:', { startTimeMinutes, endTimeMinutes, duration });
      
      // Only proceed if there's enough time for the lesson
      if (endTimeMinutes >= startTimeMinutes) {
        // Generate options at specified intervals
        for (let timeMinutes = startTimeMinutes; timeMinutes <= endTimeMinutes; timeMinutes += TIME_INTERVAL) {
          const hours = Math.floor(timeMinutes / 60);
          const minutes = timeMinutes % 60;
          
          const timeOption = new Date(selectedDate);
          timeOption.setHours(hours, minutes, 0, 0);
          
          // Only include future time slots
          if (timeOption > currentTime) {
            console.log('Adding time option:', formatTime(timeOption));
            timeOptions.push(timeOption);
          } else {
            console.log('Skipping past time option:', formatTime(timeOption));
          }
        }
      } else {
        console.log('Slot too short for selected duration');
      }
    });
    
    console.log('Total time options generated:', timeOptions.length);
    
    // Sort and remove duplicates
    return timeOptions
      .sort((a, b) => a.getTime() - b.getTime())
      .filter((time, index, self) => 
        index === 0 || time.getTime() !== self[index - 1].getTime()
      );
  };
  
  // Check if a selected time and duration would fit within tutor availability
  const isValidTimeAndDuration = (
    time: Date,
    durationMins: number,
    availabilities: TutorAvailability[],
    selectedDate: Date
  ): boolean => {
    const dayOfWeek = selectedDate.getDay();
    const dateString = formatDateToString(selectedDate);
    
    // Get minutes since midnight for the start and end time
    const startTimeMinutes = (time.getHours() * 60) + time.getMinutes();
    const endTimeMinutes = startTimeMinutes + durationMins;
    
    // First check specific dates (they take priority)
    const specificDateSlots = availabilities.filter(a => 
      !a.is_recurring && a.specific_date === dateString
    );
    
    // Check recurring days (with both 0 and 1-based indexing possibilities)
    const recurringSlots = availabilities.filter(a => 
      a.is_recurring && (a.day_of_week === dayOfWeek || a.day_of_week === ((dayOfWeek + 6) % 7 + 1))
    );
    
    const relevantSlots = specificDateSlots.length > 0 
      ? specificDateSlots 
      : recurringSlots;
    
    // Check if the time range fits within any availability slot
    return relevantSlots.some(slot => {
      let slotStartHours, slotStartMins, slotEndHours, slotEndMins;
      
      if (slot.start_time.includes('T')) {
        // Parse ISO format
        const startDate = new Date(slot.start_time);
        const endDate = new Date(slot.end_time);
        slotStartHours = startDate.getUTCHours();
        slotStartMins = startDate.getUTCMinutes();
        slotEndHours = endDate.getUTCHours();
        slotEndMins = endDate.getUTCMinutes();
      } else {
        // Parse HH:MM format
        [slotStartHours, slotStartMins] = slot.start_time.split(':').map(Number);
        [slotEndHours, slotEndMins] = slot.end_time.split(':').map(Number);
      }
      
      const availStartMinutes = (slotStartHours * 60) + slotStartMins;
      const availEndMinutes = (slotEndHours * 60) + slotEndMins;
      
      return startTimeMinutes >= availStartMinutes && 
             endTimeMinutes <= availEndMinutes;
    });
  };
  
  // Update these state variables
  // Derived state for available times
  const availableTimeOptions = useMemo(() => {
    if (!selectedDate || !duration) {
      console.log('Cannot generate time options - missing date or duration');
      return [];
    }
    return generateTimeOptions(availabilities, selectedDate);
  }, [selectedDate, duration, availabilities]);
  
  // Handle time selection
  const handleTimeSelect = (time: Date) => {
    const endTime = new Date(time);
    endTime.setMinutes(endTime.getMinutes() + duration);
    
    setSelectedTimeSlot({
      id: Date.now(), // Use timestamp as ID
      start: time,
      end: endTime
    });
  };

  // Add a debug function to show raw availability data
  useEffect(() => {
    if (availabilities.length > 0) {
      console.log('Raw availability data from API:');
      availabilities.forEach(slot => {
        console.log(
          `Slot ID ${slot.id}: ${slot.is_recurring ? 'Recurring' : 'Specific'}, ` + 
          `Day ${slot.day_of_week}, ` +
          `Time ${slot.start_time}-${slot.end_time}, ` +
          `Date: ${slot.specific_date || 'N/A'}`
        );
      });
    }
  }, [availabilities]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error || !tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Failed to load tutor data'}</p>
          <Link to="/search" className="mt-4 block text-orange-500 hover:underline">
            {t('pages.schedule_lesson.back_to_tutors')}
          </Link>
        </div>
      </div>
    );
  }

  // Check if all required booking steps are completed
  const canBookLesson = 
    selectedLanguage !== null && 
    duration > 0 && 
    selectedDate !== null && 
    selectedTimeSlot !== null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">{t('pages.schedule_lesson.title')}</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Tutor Profile Section */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('pages.schedule_lesson.tutor_profile')}</h2>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="md:w-1/3">
                <div className="w-full aspect-square rounded-full overflow-hidden bg-gray-200">
                  {tutor.user?.profile_picture_url ? (
                    <img 
                      src={tutor.user.profile_picture_url} 
                      alt={`${tutor.user.first_name} ${tutor.user.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-300 text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {tutor.rating !== undefined && (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1 font-semibold">{tutor.rating.toFixed(1)}</span>
                      {tutor.reviews_count !== undefined && (
                        <span className="ml-1 text-gray-500">({tutor.reviews_count})</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Basic Info */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-semibold text-gray-800">
                  {tutor.user?.first_name} {tutor.user?.last_name}
                </h3>
                
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <span className="font-medium">{t('pages.schedule_lesson.email')}:</span> {tutor.user?.email}
                  </div>
                  
                  {tutor.user?.sex && (
                    <div>
                      <span className="font-medium">{t('pages.schedule_lesson.sex')}:</span> {tutor.user.sex}
                    </div>
                  )}
                  
                  {tutor.user?.age && (
                    <div>
                      <span className="font-medium">{t('pages.schedule_lesson.age')}:</span> {tutor.user.age}
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium">{t('pages.schedule_lesson.years_experience')}:</span> {tutor.years_experience}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('pages.schedule_lesson.bio')}</h4>
              <p className="text-gray-700">{tutor.bio || '-'}</p>
            </div>
            
            {/* Languages */}
            {tutor.languages && tutor.languages.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('pages.schedule_lesson.languages')}</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tutor.languages.map(langItem => (
                    <li key={langItem.language_id} className="flex items-center gap-2">
                      <span>{langItem.language?.name}</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        {langItem.proficiency?.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Education */}
            {tutor.education && Array.isArray(tutor.education) && tutor.education.length > 0 && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('pages.schedule_lesson.education')}</h4>
                <div className="space-y-2">
                  {tutor.education.map((edu: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded">
                      <div className="font-medium">{edu.degree} - {edu.institution}</div>
                      <div className="text-sm text-gray-600">{edu.field_of_study}</div>
                      <div className="text-sm text-gray-600">{edu.start_year} - {edu.end_year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Intro Video - Fix for YouTube embedding */}
            {tutor.intro_video_url && (
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-800">{t('pages.schedule_lesson.intro_video')}</h4>
                <div className="aspect-video overflow-hidden rounded">
                  {getYoutubeEmbedUrl(tutor.intro_video_url) ? (
                    <iframe
                      src={getYoutubeEmbedUrl(tutor.intro_video_url) || ''}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allowFullScreen
                      title="Tutor introduction video"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-500">
                      <a 
                        href={tutor.intro_video_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:underline"
                      >
                        {t('pages.schedule_lesson.view_video')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Booking Section */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('pages.schedule_lesson.lesson_details')}</h2>
            
            {/* Success Message */}
            {bookingStatus === 'success' && (
              <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <p>{t('pages.schedule_lesson.booking_success')}</p>
                <Link to="/student/lessons" className="mt-2 inline-block text-green-700 font-semibold hover:underline">
                  {t('pages.schedule_lesson.view_your_lessons')}
                </Link>
              </div>
            )}
            
            {/* Error Message */}
            {bookingStatus === 'error' && (
              <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error || t('pages.schedule_lesson.booking_error')}</p>
              </div>
            )}
            
            <form className="space-y-6">
              {/* Step 1: Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center mr-2">1</span>
                  {t('pages.schedule_lesson.select_language')}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={selectedLanguage || ''}
                  onChange={(e) => setSelectedLanguage(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={bookingStatus === 'loading' || bookingStatus === 'success'}
                >
                  <option value="">{t('common.select')}...</option>
                  {tutor.languages?.map(lang => (
                    <option key={lang.language_id} value={lang.language_id}>
                      {lang.language?.name} ({lang.proficiency?.name})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Step 2: Duration Selection - only available after language is selected */}
              {selectedLanguage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center mr-2">2</span>
                    {t('pages.schedule_lesson.select_duration')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LESSON_DURATIONS.map(durationOption => {
                      const isDisabled = selectedTimeSlot && isExceedingEndTime(selectedTimeSlot, durationOption);
                      return (
                        <button
                          key={durationOption}
                          type="button"
                          className={`px-3 py-2 text-center text-sm rounded-md transition-colors ${
                            duration === durationOption
                              ? isDisabled 
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-orange-500 text-white'
                              : isDisabled
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => handleDurationSelect(durationOption)}
                          disabled={bookingStatus === 'loading' || bookingStatus === 'success' || isDisabled === true}
                          title={isDisabled ? t('pages.schedule_lesson.duration_exceeds_availability') : undefined}
                        >
                          {durationOption} {t('pages.schedule_lesson.duration_' + durationOption)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Step 3: Date Selection - only available after language and duration are selected */}
              {selectedLanguage && duration && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center mr-2">3</span>
                    {t('pages.schedule_lesson.select_date')}
                  </label>
                  {availableDatesList.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableDatesList.slice(0, 10).map(date => (
                        <button
                          key={date.toISOString()}
                          type="button"
                          className={`px-2 py-2 text-center text-sm rounded-md transition-colors ${
                            selectedDate && formatDateToString(selectedDate) === formatDateToString(date)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          onClick={() => setSelectedDate(date)}
                          disabled={bookingStatus === 'loading' || bookingStatus === 'success'}
                        >
                          <div className="font-semibold">
                            {date.toLocaleDateString(undefined, { day: 'numeric' })}
                          </div>
                          <div className="text-xs">
                            {date.toLocaleDateString(undefined, { month: 'short' })}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      {t('pages.schedule_lesson.no_availability')}
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 4: Time Selection - only available after language, duration, and date are selected */}
              {selectedLanguage && duration && selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center mr-2">4</span>
                    {t('pages.schedule_lesson.select_time')} - {formatDate(selectedDate)}
                  </label>
                  
                  {availableTimeOptions.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                      {availableTimeOptions.map((time, index) => {
                        const isValidBooking = isValidTimeAndDuration(
                          time, 
                          duration, 
                          availabilities, 
                          selectedDate
                        );
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            className={`px-2 py-2 text-center text-sm rounded-md transition-colors ${
                              selectedTimeSlot?.start.getTime() === time.getTime()
                                ? 'bg-orange-500 text-white'
                                : !isValidBooking
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            onClick={() => isValidBooking && handleTimeSelect(time)}
                            disabled={!isValidBooking || bookingStatus === 'loading' || bookingStatus === 'success'}
                            title={!isValidBooking ? t('pages.schedule_lesson.duration_exceeds_availability') : ''}
                          >
                            {formatTime(time)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-500 mb-4">
                        {t('pages.schedule_lesson.no_available_times')}
                      </div>
                      
                      {/* Diagnostic information */}
                      <details className="mt-2 text-xs text-gray-500 border p-2 rounded">
                        <summary className="cursor-pointer">Debug information</summary>
                        <div className="mt-2 whitespace-pre-wrap">
                          <p>Date: {selectedDate?.toISOString()}</p>
                          <p>Day of week (0-6, Sunday is 0): {selectedDate?.getDay()}</p>
                          <p>Day of week (1-7, Monday is 1): {selectedDate ? ((selectedDate.getDay() + 6) % 7) + 1 : 'none'}</p>
                          <p>Formatted date: {selectedDate ? formatDateToString(selectedDate) : 'none'}</p>
                          <p>Duration: {duration} minutes</p>
                          <p>Available slots total: {availabilities.length}</p>
                          <p>Time options generated: {availableTimeOptions.length}</p>
                          <div className="mt-2">
                            <p>Recurring slots for this day (0-based):</p>
                            <pre>
                              {JSON.stringify(
                                availabilities.filter(a => a.is_recurring && a.day_of_week === selectedDate?.getDay()),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                          <div className="mt-2">
                            <p>Recurring slots for this day (1-based):</p>
                            <pre>
                              {JSON.stringify(
                                availabilities.filter(a => a.is_recurring && a.day_of_week === (selectedDate ? ((selectedDate.getDay() + 6) % 7) + 1 : -1)),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                          <div className="mt-2">
                            <p>Specific date slots:</p>
                            <pre>
                              {JSON.stringify(
                                availabilities.filter(a => !a.is_recurring && a.specific_date === formatDateToString(selectedDate || new Date())),
                                null,
                                2
                              )}
                            </pre>
                          </div>
                          <div className="mt-2">
                            <p>Sample time parsing:</p>
                            {availabilities.filter(a => a.is_recurring && a.day_of_week === selectedDate?.getDay()).map((a, i) => (
                              <div key={i} className="text-left">
                                <p>Original: {a.start_time} - {a.end_time}</p>
                                <p>Parsed hours: {a.start_time.includes('T') ? new Date(a.start_time).getUTCHours() : a.start_time.split(':')[0]} - 
                                   {a.end_time.includes('T') ? new Date(a.end_time).getUTCHours() : a.end_time.split(':')[0]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
              
              {/* Step 5: Notes - only available after all previous steps are completed */}
              {selectedLanguage && selectedDate && selectedTimeSlot && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <span className="inline-block w-6 h-6 rounded-full bg-orange-500 text-white text-center mr-2">5</span>
                    {t('pages.schedule_lesson.notes')}
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={4}
                    placeholder={t('pages.schedule_lesson.notes_placeholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={bookingStatus === 'loading' || bookingStatus === 'success'}
                  />
                </div>
              )}
              
              {/* Submit Button */}
              <div>
                <button
                  type="button"
                  className={`w-full py-3 px-4 text-white font-medium rounded-md transition-colors ${
                    !canBookLesson
                      ? 'bg-gray-400 cursor-not-allowed'
                      : bookingStatus === 'loading'
                        ? 'bg-orange-400'
                        : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                  onClick={handleBookLesson}
                  disabled={!canBookLesson || bookingStatus === 'loading' || bookingStatus === 'success'}
                >
                  {bookingStatus === 'loading' 
                    ? t('common.saving') 
                    : t('pages.schedule_lesson.schedule_button')}
                </button>
              </div>
            
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}; 