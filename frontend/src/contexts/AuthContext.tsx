import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, userService, getErrorMessage } from '../services/api';
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

    // Initialize user from localStorage if available
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                logger.error('Failed to parse user from localStorage', { error });
                localStorage.removeItem('user');
            }
        }
    }, []);

    // Check token validity and refresh user data
    useEffect(() => {
        if (token) {
            logger.info('Found existing token, attempting to refresh user data');
            refreshUser().catch((error) => {
                logger.warn('Session expired or invalid token', { error });
                localStorage.removeItem('token');
                localStorage.removeItem('user');
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
            
            const authResponse = await authService.login(credentials);
            
            if (authResponse.token && authResponse.user) {
                localStorage.setItem('token', authResponse.token);
                localStorage.setItem('user', JSON.stringify(authResponse.user));
                setToken(authResponse.token);
                setUser(authResponse.user);
                
                logger.info('Login successful', { userId: authResponse.user.id });
                showNotification('success', 'Welcome back!');
                
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            logger.error('Login failed', { 
                username: credentials.username, 
                error,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText
            });
            showNotification('error', getErrorMessage(error));
            throw error;
        }
    };

    const register = async (data: UserRegistrationRequest) => {
        try {
            logger.info('Attempting registration', { 
                username: data.username, 
                email: data.email, 
                role: data.role 
            });
            
            console.log('Registration payload:', { 
                ...data, 
                password: '[REDACTED]'
            });
            
            const authResponse = await authService.register(data);
            
            if (authResponse.token && authResponse.user) {
                localStorage.setItem('token', authResponse.token);
                localStorage.setItem('user', JSON.stringify(authResponse.user));
                setToken(authResponse.token);
                setUser(authResponse.user);
                
                logger.info('Registration successful', { userId: authResponse.user.id });
                showNotification('success', 'Registration successful!');
                
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error: any) {
            console.error('Registration API error:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                method: error.config?.method
            });
            
            logger.error('Registration failed', { 
                error: error.message,
                response: error.response?.data,
                status: error.response?.status 
            });
            
            showNotification('error', getErrorMessage(error));
            throw error;
        }
    };

    const logout = () => {
        logger.info('User logging out', { userId: user?.id });
        authService.logout();
        setUser(null);
        setToken(null);
        showNotification('info', 'You have been logged out');
        navigate('/login');
    };

    const refreshUser = async () => {
        try {
            logger.debug('Refreshing user data');
            const userData = await userService.getProfile();
            
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            
            logger.debug('User data refreshed successfully', { 
                id: userData.id,
                username: userData.username
            });
        } catch (error: any) {
            logger.error('Failed to refresh user data', { 
                error: error.message,
                response: error.response?.data,
                status: error.response?.status 
            });
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