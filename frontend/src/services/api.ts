import axios, { AxiosError } from 'axios';
import { User, LoginRequest, UserRegistrationRequest, UserUpdateRequest, AuthResponse } from '../types';
import { Lesson } from '../types/lesson';

// Helper function to extract error messages from different API error formats
export const getErrorMessage = (error: any): string => {
    if (!error.response) {
        return error.message || 'Network error';
    }

    const { data } = error.response;
    
    // Check various error formats
    if (typeof data === 'string') {
        return data;
    }
    
    if (data && data.error) {
        return data.error;
    }
    
    if (data && data.message) {
        return data.message;
    }
    
    if (data && data.errors && Array.isArray(data.errors)) {
        return data.errors.join(', ');
    }
    
    return error.response.statusText || 'An unknown error occurred';
};

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
console.log('API baseURL:', baseURL);

export const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Add withCredentials for CORS with credentials if needed
    withCredentials: false,
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
            headers: config.headers,
            data: config.data ? (
                typeof config.data === 'object' && config.data.password 
                    ? { ...config.data, password: '[REDACTED]' } 
                    : config.data
            ) : undefined,
        });
        
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('API Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('API Response error:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            url: error.config?.url,
            method: error.config?.method
        });
        
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth Service
export const authService = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post('/api/auth/login', credentials);
            return response.data;
        } catch (error) {
            console.error('Login service error:', error);
            throw error;
        }
    },

    register: async (data: UserRegistrationRequest): Promise<AuthResponse> => {
        try {
            const response = await apiClient.post('/api/auth/register', data);
            return response.data;
        } catch (error) {
            console.error('Register service error:', error);
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// User Service
export const userService = {
    getProfile: async (): Promise<User> => {
        try {
            const response = await apiClient.get('/api/users/me');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: async (data: UserUpdateRequest): Promise<User> => {
        try {
            const response = await apiClient.put('/api/users/me', data);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    updatePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        try {
            await apiClient.put('/api/users/me/password', { 
                currentPassword: oldPassword, 
                newPassword: newPassword 
            });
        } catch (error) {
            console.error('Update password error:', error);
            throw error;
        }
    }
};

export interface RoomParticipant {
    id: number;
    lessonId: number;
    userId: number;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    joinedAt: string;
    leftAt?: string;
}

export interface RoomInfo {
    roomId: string;
    token: string;
    participants: RoomParticipant[];
}

export default {
    auth: authService,
    user: userService,
}; 