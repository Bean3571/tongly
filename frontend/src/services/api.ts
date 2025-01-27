import axios from 'axios';
import { User, LoginCredentials, RegisterData, ProfileUpdateData } from '../types';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth Service
export const authService = {
    login: async (credentials: LoginCredentials): Promise<{ token: string; user: User }> => {
        const response = await apiClient.post('/api/auth/login', credentials);
        return response.data;
    },

    register: async (data: RegisterData): Promise<{ token: string; user: User }> => {
        const response = await apiClient.post('/api/auth/register', data);
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
    }
};

// User Service
export const userService = {
    getProfile: async (): Promise<User> => {
        const response = await apiClient.get('/api/profile');
        return response.data;
    },

    updateProfile: async (data: ProfileUpdateData): Promise<void> => {
        await apiClient.put('/api/profile', data);
    },

    updatePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
        await apiClient.put('/api/profile/password', { oldPassword, newPassword });
    }
};

export default {
    auth: authService,
    user: userService
}; 