import React, { createContext, useContext, useState } from 'react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
    id: number;
    type: NotificationType;
    message: string;
}

interface NotificationContextType {
    notifications: Notification[];
    showNotification: (type: NotificationType, message: string) => void;
    removeNotification: (id: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    showNotification: () => {},
    removeNotification: () => {},
});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = (type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
            {children}
            {/* Notification Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 rounded-lg shadow-lg max-w-md transform transition-all duration-300 
                                  ${notification.type === 'success' ? 'bg-green-500 text-white' :
                                    notification.type === 'error' ? 'bg-red-500 text-white' :
                                    notification.type === 'warning' ? 'bg-yellow-500 text-white' :
                                    'bg-blue-500 text-white'}`}
                    >
                        <div className="flex justify-between items-center">
                            <p className="font-medium">{notification.message}</p>
                            <button
                                onClick={() => removeNotification(notification.id)}
                                className="ml-4 text-white hover:text-gray-200 transition-colors"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}; 