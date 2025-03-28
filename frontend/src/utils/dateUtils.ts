import { format, formatDistanceToNow } from 'date-fns';

export const formatDateTime = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }
        return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
        return 'Invalid date';
    }
};

export const formatTime = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return 'Invalid time';
        }
        return format(date, 'h:mm a');
    } catch (error) {
        return 'Invalid time';
    }
};

export const getTimeStatus = (startTime: string, endTime: string, cancelled: boolean) => {
    try {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const now = new Date();

        if (cancelled) {
            return 'Cancelled';
        }

        // Lesson is in the future
        if (startDate > now) {
            const timeUntil = formatDistanceToNow(startDate, { addSuffix: true });
            return `Starts ${timeUntil}`;
        }

        // Lesson is currently happening
        if (now >= startDate && now <= endDate) {
            return 'In Progress';
        }

        // Lesson is in the past
        if (now > endDate) {
            return 'Completed';
        }

        return formatDateTime(startTime);
    } catch (error) {
        console.error('Error getting time status:', error);
        return formatDateTime(startTime);
    }
};

export const getHoursUntilStart = (startTime: string): number => {
    const start = new Date(startTime);
    const now = new Date();
    return (start.getTime() - now.getTime()) / (1000 * 60 * 60);
}; 