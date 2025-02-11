import React from 'react';

type LessonStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface LessonStatusBadgeProps {
    status: LessonStatus;
}

export const LessonStatusBadge: React.FC<LessonStatusBadgeProps> = ({ status }) => {
    const statusStyles = {
        scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}; 