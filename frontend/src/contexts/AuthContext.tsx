import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { logger } from '../services/logger';
import { User, UserRole, UserRegistrationRequest, LoginRequest, AuthResponse } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    login: (credentials: LoginRequest) => Promise<void>;
    register: (data: UserRegistrationRequest) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    setUser: () => {},
    setToken: () => {},
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        if (token) {
            logger.info('Found existing token, attempting to refresh user data');
            refreshUser().catch(() => {
                logger.warn('Session expired or invalid token');
                localStorage.removeItem('token');
                setUser(null);
                setToken(null);
                showNotification('error', 'Session expired. Please login again.');
                navigate('/login');
            });
        }
    }, []);

    const login = async (credentials: LoginRequest) => {
        try {
            logger.info('Attempting login', { username: credentials.username });
            const response = await api.auth.login(credentials);
            
            if (response && response.data) {
                const authResponse = response.data;
                
                if (authResponse.token && authResponse.user) {
                    localStorage.setItem('token', authResponse.token);
                    setToken(authResponse.token);
                    setUser(authResponse.user);
                    
                    logger.info('Login successful', { userId: authResponse.user.id });
                    showNotification('success', 'Welcome back!');
                    
                    // Navigate based on role
                    if (authResponse.user.role === UserRole.TUTOR) {
                        navigate('/lessons');
                    } else {
                        navigate('/tutors');
                    }
                } else {
                    throw new Error('Invalid response from server');
                }
            }
        } catch (error) {
            logger.error('Login failed', { username: credentials.username, error });
            showNotification('error', 'Invalid username or password');
            throw error;
        }
    };

    const register = async (data: UserRegistrationRequest) => {
        try {
            logger.info('Attempting registration', { username: data.username, email: data.email, role: data.role });
            const response = await api.auth.register(data);
            
            if (response && response.data) {
                const authResponse = response.data;
                
                if (authResponse.token && authResponse.user) {
                    localStorage.setItem('token', authResponse.token);
                    setToken(authResponse.token);
                    setUser(authResponse.user);
                    
                    logger.info('Registration successful', { username: data.username });
                    showNotification('success', 'Registration successful! Welcome to Tongly.');
                    
                    // Redirect based on role
                    if (data.role === UserRole.TUTOR) {
                        navigate('/lessons');
                    } else {
                        navigate('/tutors');
                    }
                } else {
                    throw new Error('Invalid response from server');
                }
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
        logger.info('User logging out', { userId: user?.id });
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        showNotification('info', 'You have been logged out');
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            logger.debug('Refreshing user data');
            const response = await api.user.getProfile();
            
            if (response && response.data) {
                const userData = response.data;
                setUser(userData);
                
                logger.debug('User data refreshed successfully', { 
                    id: userData.id,
                    username: userData.username
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
        <AuthContext.Provider value={{ 
            user, 
            token, 
            setUser, 
            setToken, 
            login, 
            register, 
            logout, 
            refreshUser 
        }}>
            {children}
        </AuthContext.Provider>
    );
}; 