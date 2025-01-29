import axios from 'axios';
import type { AxiosRequestConfig } from 'axios/index';
<<<<<<< Updated upstream
import type { LoginCredentials, RegisterData, ProfileUpdateData, TutorRegistrationData } from '../types';
=======
import type { LanguageLevel } from '../types';
>>>>>>> Stashed changes

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

console.log('API Client initialized with baseURL:', baseURL);

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
            console.log('Request:', {
                method: config.method,
                url: config.url,
                headers: {
                    ...config.headers,
                    Authorization: 'Bearer [REDACTED]'
                }
            });
        } else {
            console.log('Request:', {
                method: config.method,
                url: config.url,
                headers: config.headers
            });
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
    (response) => {
        console.log('Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            console.log('Unauthorized access, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

interface LoginCredentials {
    username: string;
    password: string;
}

interface RegisterData {
    username: string;
    email: string;
    password: string;
    role: string;
}

export interface ProfileUpdateData {
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    age?: number | null;
    native_language?: string | null;
    languages?: LanguageLevel[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete?: boolean;
}

export const api = {
    auth: {
        login: async (credentials: LoginCredentials) => {
            try {
                const response = await apiClient.post('/api/auth/login', credentials);
                return response.data;
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        },
        register: async (data: RegisterData) => {
<<<<<<< Updated upstream
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
=======
            try {
                const response = await apiClient.post('/api/auth/register', data);
                return response.data;
            } catch (error) {
                console.error('Registration failed:', error);
                throw error;
            }
>>>>>>> Stashed changes
        },
    },
    user: {
        getProfile: async () => {
            try {
                const response = await apiClient.get('/api/profile');
                return response.data;
            } catch (error) {
                console.error('Failed to get profile:', error);
                throw error;
            }
        },
        updateProfile: async (data: ProfileUpdateData) => {
            try {
                const response = await apiClient.put('/api/profile', data);
                return response.data;
            } catch (error) {
                console.error('Failed to update profile:', error);
                throw error;
            }
        },
        updatePassword: async (oldPassword: string, newPassword: string) => {
            try {
                const response = await apiClient.put('/api/profile/password', { oldPassword, newPassword });
                return response.data;
            } catch (error) {
                console.error('Failed to update password:', error);
                throw error;
            }
        },
    },
};

export default api; 