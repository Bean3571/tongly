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

export const getTimeStatus = (startTime: string, status: string) => {
    try {
        const date = new Date(startTime);
        const now = new Date();

        if (status === 'completed') {
            return 'Completed';
        }

        if (status === 'cancelled') {
            return 'Cancelled';
        }

        if (status === 'in_progress') {
            return 'In Progress';
        }

        // For scheduled lessons
        if (date > now) {
            const timeUntil = formatDistanceToNow(date, { addSuffix: true });
            return `Starts ${timeUntil}`;
        }

        // If the lesson has started but not marked as in_progress
        const endTime = new Date(date.getTime() + 45 * 60 * 1000); // Assuming 45 min default
        if (now >= date && now <= endTime) {
            return 'In Progress';
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