import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useNotification } from './NotificationContext';
import type { User, LoginCredentials, ProfileUpdateData, NotificationType, RegisterData } from '../types';

export interface AuthContextType {
    user: any;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    register: (data: any) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            api.user.getProfile()
                .then(userData => {
                    setUser(userData);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                });
        }
    }, []);

    const refreshUser = async () => {
        try {
            const response = await api.user.getProfile();
            setUser(response.data);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await api.auth.login(credentials);
            setUser(response.data);
            localStorage.setItem('token', response.token);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await api.auth.register(data);
            setUser(response.data);
            localStorage.setItem('token', response.token);
            navigate('/survey');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        showNotification('info', 'You have been logged out');
        navigate('/login');
    };

    const value = {
        user,
        login,
        logout,
        register,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 