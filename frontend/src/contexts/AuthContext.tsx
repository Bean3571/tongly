import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { RegisterData } from '../api/client';
import { useNotification } from './NotificationContext';
import { logger } from '../services/logger';
import type { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
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
                navigate('/login');
            });
        }
    }, []);

    const login = async (username: string, password: string) => {
        try {
            logger.info('Attempting login', { username });
            const response = await api.auth.login({ username, password });
            
            // Accept the response if it has a token, even if user data is incomplete
            if (response && response.token) {
                // Store the token regardless of user data completeness
                localStorage.setItem('token', response.token);
                
                // Ensure user object has minimum required structure
                if (!response.user) {
                    response.user = { credentials: { username, role: 'student', id: 0, email: '' } };
                }
                
                if (!response.user.credentials) {
                    response.user.credentials = { username, role: 'student', id: 0, email: '' };
                }
                
                setUser(response.user);
                logger.info('Login successful', { userId: response.user.credentials.id });
                showNotification('success', 'Welcome back!');
                
                // Navigate based on role if available
                if (response.user.credentials.role === 'tutor') {
                    navigate('/lessons');
                } else {
                    navigate('/tutors');
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            logger.error('Login failed', { username, error });
            showNotification('error', 'Invalid username or password');
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            logger.info('Attempting registration', { username: data.username, email: data.email, role: data.role });
            const response = await api.auth.register(data);
            
            // Accept the response if it has a token, even if user data is incomplete
            if (response && response.token) {
                // Store the token regardless of user data completeness
                localStorage.setItem('token', response.token);
                
                // Ensure user object has minimum required structure
                if (!response.user) {
                    response.user = { 
                        credentials: { 
                            username: data.username, 
                            email: data.email, 
                            role: (data.role as 'student' | 'tutor' | 'admin') || 'student', 
                            id: 0 
                        } 
                    };
                }
                
                if (!response.user.credentials) {
                    response.user.credentials = { 
                        username: data.username, 
                        email: data.email, 
                        role: (data.role as 'student' | 'tutor' | 'admin') || 'student', 
                        id: 0 
                    };
                }
                
                setUser(response.user);
                logger.info('Registration successful', { username: data.username });
                showNotification('success', 'Registration successful! Welcome to Tongly.');
                
                // Redirect based on role
                if (data.role === 'tutor') {
                    navigate('/lessons');
                } else {
                    navigate('/tutors');
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            logger.error('Registration failed', { 
                error: error.message,
                response: error.response?.data,
                status: error.response?.status 
            });
            showNotification('error', error.response?.data?.error || 'Registration failed. Please try again.');
            throw error;
        }
    };

    const logout = () => {
        logger.info('User logging out', { userId: user?.credentials?.id });
        localStorage.removeItem('token');
        setUser(null);
        showNotification('info', 'You have been logged out');
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            logger.debug('Refreshing user data');
            const userData = await api.user.getProfile();
            
            // Debug the actual data structure received
            logger.debug('User data received from API:', { userData: JSON.stringify(userData) });
            
            // Be more lenient with user data validation
            if (userData) {
                // Handle various response formats from the backend
                // If userData has properties at root level (not in credentials object)
                const userId = userData.credentials?.id || (userData as any).id || 0;
                const username = userData.credentials?.username || (userData as any).username || '';
                const email = userData.credentials?.email || (userData as any).email || '';
                const role = userData.credentials?.role || (userData as any).role || 'student';
                
                // Ensure credentials object exists with proper data
                if (!userData.credentials) {
                    userData.credentials = { 
                        id: userId, 
                        username, 
                        email, 
                        role 
                    };
                    
                    // Log that we're adapting the structure
                    logger.debug('Adapting user data structure with credentials:', { 
                        userId, username, email, role 
                    });
                } else if (userData.credentials.username === 'unknown' && (userData as any).username) {
                    // If we have unknown username in credentials but have username at root level, use that
                    userData.credentials.username = (userData as any).username;
                    logger.debug('Replacing unknown username with actual username from root level');
                }
                
                // Store username in localStorage as a fallback
                if (username && username !== 'unknown') {
                    localStorage.setItem('username', username);
                }
                
                setUser(userData);
                logger.debug('User data refreshed successfully', { 
                    id: userData.credentials.id,
                    username: userData.credentials.username
                });
            } else {
                throw new Error('No user data received during refresh');
            }
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