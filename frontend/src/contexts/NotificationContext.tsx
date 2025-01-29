import React, { createContext, useContext, useState, useCallback } from 'react';
import { NotificationType } from '../types';

interface Notification {
    type: NotificationType;
    message: string;
}

interface NotificationContextType {
    notification: Notification | null;
    showNotification: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notification, setNotification] = useState<Notification | null>(null);
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

    const showNotification = useCallback((type: NotificationType, message: string) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        setNotification({ type, message });

        const id = setTimeout(() => {
            setNotification(null);
            setTimeoutId(null);
        }, 3000);

        setTimeoutId(id);
    }, [timeoutId]);

    return (
        <NotificationContext.Provider value={{ notification, showNotification }}>
            {children}
        </NotificationContext.Provider>
    );
}; 