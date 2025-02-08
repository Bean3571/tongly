import axios from 'axios';
import type { AxiosRequestConfig } from 'axios/index';
import type { LanguageLevel } from '../types';
import { logger } from '../services/logger';
import { TutorProfileUpdateRequest } from '../types/tutor';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

logger.info('API Client initialized with baseURL:', baseURL);

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
            logger.debug('Request:', {
                method: config.method,
                url: config.url,
                headers: {
                    ...config.headers,
                    Authorization: 'Bearer [REDACTED]'
                }
            });
        } else {
            logger.debug('Request:', {
                method: config.method,
                url: config.url,
                headers: config.headers
            });
        }
        return config;
    },
    (error) => {
        logger.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        logger.debug('Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data
        });
        return response;
    },
    (error) => {
        logger.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });

        if (error.response?.status === 401) {
            logger.warn('Unauthorized access, redirecting to login');
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

export interface RegisterData {
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
    sex?: 'male' | 'female' | 'other' | null;
    native_language?: string | null;
    languages?: LanguageLevel[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete?: boolean;

}

interface TutorRegistrationData {
    education_degree: string;
    education_institution: string;
    introduction_video: string;
    hourly_rate: number;
    offers_trial: boolean;
}

export interface TutorProfileUpdateData {
    teachingLanguages?: LanguageLevel[];
    education?: {
        degree: string;
        institution: string;
        fieldOfStudy: string;
        graduationYear: string;
        documentUrl: string;
    };
    bio?: string;
    hourlyRate?: number;
    offersTrial?: boolean;
    introductionVideo?: string;
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
            try {
                logger.info('Making registration request', { 
                    url: '/api/auth/register',
                    data: { ...data, password: '[REDACTED]' }
                });
                const response = await apiClient.post('/api/auth/register', data);
                return response.data;
            } catch (error: any) {
                logger.error('Registration request failed', {
                    error: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                throw error;
            }
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
        updatePassword: async (currentPassword: string, newPassword: string) => {
            try {
                const response = await apiClient.put('/api/profile/password', {
                    current_password: currentPassword,
                    new_password: newPassword,
                });
                return response.data;
            } catch (error) {
                console.error('Failed to update password:', error);
                throw error;
            }
        },
        uploadProfilePicture: async (formData: FormData) => {
            try {
                const response = await apiClient.post('/api/profile/avatar', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data;
            } catch (error) {
                console.error('Failed to upload profile picture:', error);
                throw error;
            }
        },
    },
    tutors: {
        register: async (data: TutorRegistrationData) => {
            try {
                const response = await apiClient.post('/api/tutors', data);
                return response.data;
            } catch (error) {
                console.error('Failed to register as tutor:', error);
                throw error;
            }
        },
        updateProfile: async (data: TutorProfileUpdateData) => {
            try {
                const response = await apiClient.put('/api/tutors/profile', data);
                return response.data;
            } catch (error) {
                console.error('Failed to update tutor profile:', error);
                throw error;
            }
        },
        getProfile: async () => {
            try {
                const response = await apiClient.get('/api/tutors/profile');
                return response.data;
            } catch (error) {
                console.error('Failed to get tutor profile:', error);
                throw error;
            }
        },
        uploadVideo: async (formData: FormData) => {
            try {
                const response = await apiClient.post('/api/tutors/video', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                return response.data;
            } catch (error) {
                console.error('Failed to upload video:', error);
                throw error;
            }
        },
        updateTutorProfile: async (data: TutorProfileUpdateRequest) => {
            try {
                const response = await apiClient.put('/api/tutors/profile', data);
                return response.data;
            } catch (error) {
                console.error('Failed to update tutor profile:', error);
                throw error;
            }
        },
    },
};

export default api; 