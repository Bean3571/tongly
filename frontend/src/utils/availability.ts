import { TutorAvailability, AvailableTimeSlot } from '../types/tutor';

/**
 * Converts a time string (HH:MM:SS or ISO format) to a Date object on the specified date
 */
export const timeStringToDate = (timeString: string, date: Date): Date => {
  const result = new Date(date);
  
  if (timeString.includes('T')) {
    // Handle ISO format (like "0000-01-01T12:06:00Z")
    const timeDate = new Date(timeString);
    result.setHours(timeDate.getUTCHours(), timeDate.getUTCMinutes(), 0, 0);
  } else {
    // Handle simple HH:MM format
    const [hours, minutes] = timeString.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
  }
  
  return result;
};

/**
 * Gets the day of week (0-6, Sunday is 0) for a date
 */
export const getDayOfWeek = (date: Date): number => {
  return date.getDay();
};

/**
 * Formats a date as YYYY-MM-DD
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Finds available time slots for a specific date based on tutor's availability
 */
export const getAvailableTimeSlots = (
  availabilities: TutorAvailability[],
  date: Date
): AvailableTimeSlot[] => {
  const dayOfWeek = getDayOfWeek(date);
  const dateString = formatDateToString(date);
  
  // Filter availabilities for this specific date (both recurring and specific)
  const matchingAvailabilities = availabilities.filter(a => {
    // Check if it's a recurring availability for this day of week
    const matchesRecurring = a.is_recurring && a.day_of_week === dayOfWeek;
    
    // Check if it's a specific date availability
    const matchesSpecific = !a.is_recurring && a.specific_date === dateString;
    
    return matchesRecurring || matchesSpecific;
  });
  
  // Convert each availability to time slots
  return matchingAvailabilities.map(a => ({
    id: a.id,
    start: timeStringToDate(a.start_time, date),
    end: timeStringToDate(a.end_time, date)
  }));
};

/**
 * Get all available dates (next 30 days) that have at least one time slot
 */
export const getAvailableDates = (availabilities: TutorAvailability[]): Date[] => {
  const result: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = getDayOfWeek(date);
    const dateString = formatDateToString(date);
    
    // Check if there's any availability for this date
    const hasAvailability = availabilities.some(a => {
      return (a.is_recurring && a.day_of_week === dayOfWeek) || 
             (!a.is_recurring && a.specific_date === dateString);
    });
    
    if (hasAvailability) {
      result.push(date);
    }
  }
  
  return result;
}; 