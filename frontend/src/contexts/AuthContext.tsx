import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useNotification } from './NotificationContext';
import { logger } from '../services/logger';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            logger.info('Found existing token, attempting to refresh user data');
            refreshUser().catch(() => {
                logger.warn('Session expired or invalid token');
                localStorage.removeItem('token');
                setUser(null);
                showNotification('error', 'Session expired. Please login again.');
            });
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            logger.info('Attempting login', { username });
            const response = await api.auth.login({ username, password });
            localStorage.setItem('token', response.token);
            setUser(response.user);
            logger.info('Login successful', { userId: response.user.id });
            showNotification('success', 'Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            logger.error('Login failed', { username, error });
            showNotification('error', 'Invalid username or password');
            throw error;
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            logger.info('Attempting registration', { username, email });
            const response = await api.auth.register({ username, email, password, role: 'student' });
            localStorage.setItem('token', response.token);
            setUser(response.user);
            logger.info('Registration successful', { userId: response.user.id });
            showNotification('success', 'Registration successful! Let\'s set up your profile.');
            navigate('/survey');
        } catch (error) {
            logger.error('Registration failed', { username, email, error });
            showNotification('error', 'Registration failed. Please try again.');
            throw error;
        }
    };

    const logout = () => {
        logger.info('User logging out', { userId: user?.id });
        localStorage.removeItem('token');
        setUser(null);
        showNotification('info', 'You have been logged out');
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            logger.debug('Refreshing user data');
            const userData = await api.user.getProfile();
            setUser(userData);
            logger.debug('User data refreshed successfully', { userId: userData.id });
        } catch (error) {
            logger.error('Failed to refresh user data', { error });
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}; 