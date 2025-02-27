import { format, formatDistanceToNow, differenceInHours } from 'date-fns';

export const formatDateTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMM d, yyyy h:mm a');
};

export const getTimeStatus = (startTime: string, status: string): string => {
    const start = new Date(startTime);
    const now = new Date();

    // For scheduled lessons
    if (status === 'scheduled') {
        if (start > now) {
            return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
        } else {
            return 'Starting now';
        }
    }

    // If the lesson has started but not marked as in_progress
    if (start <= now && status === 'scheduled') {
        return 'Ready to join';
    }

    return '';
};

export const getHoursUntilStart = (startTime: string): number => {
    const start = new Date(startTime);
    const now = new Date();
    return differenceInHours(start, now);
}; 