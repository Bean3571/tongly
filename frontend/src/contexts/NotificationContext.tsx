import React, { createContext, useContext, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
    message: string;
    type: NotificationType;
}

interface NotificationContextType {
    showNotification: (type: NotificationType, message: string) => void;
    notification: NotificationState | null;
    hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notification, setNotification] = useState<NotificationState | null>(null);

    const showNotification = (type: NotificationType, message: string) => {
        setNotification({ type, message });
        setTimeout(() => {
            setNotification(null);
        }, 3000);
    };

    const hideNotification = () => {
        setNotification(null);
    };

    return (
        <NotificationContext.Provider value={{ showNotification, notification, hideNotification }}>
            {children}
            {notification && (
                <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500' :
                    notification.type === 'error' ? 'bg-red-500' :
                    notification.type === 'warning' ? 'bg-yellow-500' :
                    'bg-orange-500'
                } text-white`}>
                    {notification.message}
                </div>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
} 