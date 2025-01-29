import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { NotificationType } from '../types';

const getBackgroundColor = (type: NotificationType): string => {
    switch (type) {
        case 'success':
            return 'bg-green-500';
        case 'error':
            return 'bg-red-500';
        case 'warning':
            return 'bg-yellow-500';
        case 'info':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
};

const Notification: React.FC = () => {
    const { notification } = useNotification();

    if (!notification) return null;

    const { type, message } = notification;
    const bgColor = getBackgroundColor(type);

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg`}>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default Notification; 