import { notification } from 'antd';
import type { AxiosRequestConfig } from 'axios/index';
import type { LanguageLevel, Degree } from '../types';
import { logger } from '../services/logger';
import { TutorProfileUpdateRequest } from '../types/tutor';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

logger.info('API Client initialized with baseURL:', baseURL);

interface ApiError {
    message: string;
    code?: string;
    details?: any;
}

interface ApiResponse<T> {
    data: T;
    error?: ApiError;
}

interface Credentials {
    id: number;
    username: string;
    email: string;
    role: 'student' | 'tutor' | 'admin';
}

interface User {
    credentials: Credentials;
    profile?: {
        first_name?: string;
        last_name?: string;
        profile_picture?: string;
        // Add other profile fields as needed
    };
}

interface ApiClientOptions {
    headers?: Record<string, string | undefined>;
}

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = baseURL;
    }

    private getHeaders(options?: ApiClientOptions): HeadersInit {
        const token = localStorage.getItem('token');
        const defaultHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
        return {
            ...defaultHeaders,
            ...(options?.headers || {}),
        };
    }

    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        if (!response.ok) {
            let error: ApiError = {
                message: 'An error occurred',
            };

            try {
                const errorData = await response.json();
                error = {
                    message: errorData.message || error.message,
                    code: errorData.code,
                    details: errorData.details,
                };
            } catch {
                error.message = response.statusText;
            }

            // Handle specific status codes
            switch (response.status) {
                case 401:
                    // Redirect to login
                    window.location.href = '/login';
                    error.message = 'Session expired. Please log in again.';
                    break;
                case 403:
                    error.message = 'You do not have permission to perform this action';
                    break;
                case 404:
                    error.message = 'Resource not found';
                    break;
                case 422:
                    error.message = 'Invalid data provided';
                    break;
                case 429:
                    error.message = 'Too many requests. Please try again later.';
                    break;
                case 500:
                    error.message = 'Server error. Please try again later.';
                    break;
            }

            throw error;
        }

        const data = await response.json();
        return { data };
    }

    private showError(error: ApiError) {
        notification.error({
            message: 'Error',
            description: error.message,
            duration: 5,
        });
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined) {
                        url.searchParams.append(key, value);
                    }
                });
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    async post<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(options),
                body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : undefined,
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : undefined,
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }
    
    async deleteWithParams<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined) {
                        url.searchParams.append(key, value);
                    }
                });
            }

            const response = await fetch(url.toString(), {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            return await this.handleResponse<T>(response);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    // Specialized methods for file uploads
    async uploadFile<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const progress = (event.loaded / event.total) * 100;
                        onProgress(progress);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({ data: JSON.parse(xhr.response) });
                    } else {
                        reject(new Error(xhr.statusText));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.open('POST', `${this.baseUrl}${endpoint}`);
                const token = localStorage.getItem('token');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
            });
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    // Download file method
    async downloadFile(endpoint: string, filename: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }
}

export const apiClient = new ApiClient();

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
    sex?: 'male' | 'female' | 'not_set';
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
    offers_trial: boolean;
}

export interface TutorProfileUpdateData {
    nativeLanguages?: string[];
    teachingLanguages?: LanguageLevel[];
    degrees?: Degree[];
    bio?: string;
    interests?: string[];
    offersTrial?: boolean;
    introductionVideo?: string;
}

export interface VideoUploadResponse {
    message: string;
    videoUrl: string;
}

interface LoginResponse {
    token: string;
    user: User;
}

interface RegisterResponse {
    token: string;
    user: User;
}

export interface Language {
    id: string;
    name: string;
}

export interface Interest {
    id: string;
    name: string;
}

export interface Goal {
    id: string;
    name: string;
}

export interface LanguageProficiency {
    id: string;
    name: string;
}

export interface DegreeType {
    id: string;
    name: string;
}

export const api = {
    auth: {
        login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
            try {
                const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
                return response.data;
            } catch (error) {
                console.error('Login failed:', error);
                throw error;
            }
        },
        register: async (data: RegisterData): Promise<RegisterResponse> => {
            try {
                logger.info('Making registration request', { 
                    url: '/api/auth/register',
                    data: { ...data, password: '[REDACTED]' }
                });
                const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
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
        refreshToken: async (): Promise<{ token: string }> => {
            try {
                const response = await apiClient.post<{ token: string }>('/api/auth/refresh');
                return response.data;
            } catch (error) {
                console.error('Failed to refresh token:', error);
                throw error;
            }
        }
    },
    user: {
        getProfile: async (): Promise<User> => {
            try {
                const response = await apiClient.get<User>('/api/users/me');
                return response.data;
            } catch (error) {
                console.error('Failed to get profile:', error);
                throw error;
            }
        },
        updateProfile: async (data: ProfileUpdateData): Promise<User> => {
            try {
                const response = await apiClient.put<User>('/api/users/me', data);
                return response.data;
            } catch (error) {
                console.error('Failed to update profile:', error);
                throw error;
            }
        },
        updatePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
            try {
                console.log('Making password update request to /api/users/me/password');
                const response = await apiClient.put<{ message: string }>('/api/users/me/password', {
                    current_password: currentPassword,
                    new_password: newPassword,
                });
                console.log('Password update response successful');
                return response.data;
            } catch (error: any) {
                console.error('Failed to update password:', {
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
                // Rethrow to allow component-level error handling
                throw error;
            }
        },
        uploadProfilePicture: async (formData: FormData): Promise<{ url: string }> => {
            try {
                const response = await apiClient.post<{ url: string }>('/api/users/me/avatar', formData, {
                    headers: {
                        'Content-Type': undefined,
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
            } catch (error: any) {
                logger.error('Failed to register as tutor:', error);
                throw error;
            }
        },
        updateProfile: async (data: TutorProfileUpdateData) => {
            try {
                const response = await apiClient.put('/api/tutors/me', data);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to update tutor profile:', error);
                throw error;
            }
        },
        getProfile: async () => {
            try {
                const response = await apiClient.get('/api/tutors/me');
                return response.data;
            } catch (error: any) {
                logger.error('Failed to get tutor profile:', error);
                throw error;
            }
        },
        listTutors: async (page: number = 1, pageSize: number = 10) => {
            try {
                const response = await apiClient.get('/api/tutors', {
                    page: page.toString(),
                    page_size: pageSize.toString()
                });
                return response.data;
            } catch (error: any) {
                logger.error('Failed to list tutors:', error);
                throw error;
            }
        },
        searchTutors: async (filters: any) => {
            try {
                const params: Record<string, string> = {};
                
                if (filters.languages) {
                    if (Array.isArray(filters.languages)) {
                        params.languages = filters.languages.join(',');
                    } else {
                        params.languages = filters.languages;
                    }
                }
                
                const response = await apiClient.get('/api/tutors/search', params);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to search tutors:', error);
                throw error;
            }
        },
        updateTutorProfile: async (data: TutorProfileUpdateRequest) => {
            try {
                logger.info('Updating tutor profile:', {
                    url: '/api/tutors/me',
                    data: {
                        ...data,
                        // Redact any sensitive information
                        introductionVideo: data.introductionVideo ? '[VIDEO URL]' : null
                    }
                });

                const response = await apiClient.put('/api/tutors/me', data);
                
                logger.info('Tutor profile update successful:', {
                    data: response.data
                });
                return response.data;
            } catch (error: any) {
                logger.error('Failed to update tutor profile:', {
                    error: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                throw error;
            }
        },
        uploadVideo: async (formData: FormData): Promise<VideoUploadResponse> => {
            try {
                logger.info('Uploading video:', {
                    url: '/api/tutors/me/video',
                    formData: '[FORM DATA]'
                });
                const response = await apiClient.post<VideoUploadResponse>('/api/tutors/me/video', formData, {
                    headers: {
                        'Content-Type': undefined, // Let the browser set the correct Content-Type for FormData
                    },
                });
                return response.data;
            } catch (error: any) {
                logger.error('Failed to upload video:', error);
                throw error;
            }
        },
    },
    students: {
        getProfile: async () => {
            try {
                const response = await apiClient.get('/api/students/me');
                return response.data;
            } catch (error: any) {
                logger.error('Failed to get student profile:', error);
                throw error;
            }
        },
        updateProfile: async (data: any) => {
            try {
                const response = await apiClient.put('/api/students/me', data);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to update student profile:', error);
                throw error;
            }
        },
        updateStreak: async (data: any) => {
            try {
                const response = await apiClient.put('/api/students/me/streak', data);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to update streak:', error);
                throw error;
            }
        }
    },
    lessons: {
        getAll: async (status?: string) => {
            try {
                const params: Record<string, string> = {};
                if (status) {
                    params.status = status;
                }
                
                const response = await apiClient.get('/api/lessons', params);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to get lessons:', error);
                throw error;
            }
        },
        getUpcoming: async () => {
            try {
                return await api.lessons.getAll('upcoming');
            } catch (error: any) {
                logger.error('Failed to get upcoming lessons:', error);
                throw error;
            }
        },
        getCompleted: async () => {
            try {
                return await api.lessons.getAll('completed');
            } catch (error: any) {
                logger.error('Failed to get completed lessons:', error);
                throw error;
            }
        },
        getById: async (id: number) => {
            try {
                const response = await apiClient.get(`/api/lessons/${id}`);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to get lesson:', error);
                throw error;
            }
        },
        book: async (data: any) => {
            try {
                const response = await apiClient.post('/api/lessons', data);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to book lesson:', error);
                throw error;
            }
        },
        cancel: async (id: number, reason?: string) => {
            try {
                const params: Record<string, string> = {};
                if (reason) {
                    params.reason = reason;
                }
                
                const response = await apiClient.deleteWithParams(`/api/lessons/${id}`, params);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to cancel lesson:', error);
                throw error;
            }
        },
        joinRoom: async (id: number) => {
            try {
                const response = await apiClient.post(`/api/lessons/${id}/room/join`);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to join lesson room:', error);
                throw error;
            }
        },
        getRoomInfo: async (id: number) => {
            try {
                const response = await apiClient.get(`/api/lessons/${id}/room`);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to get room info:', error);
                throw error;
            }
        },
        leaveRoom: async (id: number) => {
            try {
                const response = await apiClient.post(`/api/lessons/${id}/room/leave`);
                return response.data;
            } catch (error: any) {
                logger.error('Failed to leave lesson room:', error);
                throw error;
            }
        }
    },
    lists: {
        getLanguages: async (): Promise<Language[]> => {
            try {
                const response = await apiClient.get<Language[]>('/api/lists/languages');
                return response.data;
            } catch (error) {
                console.error('Failed to fetch languages:', error);
                throw error;
            }
        },
        getInterests: async (): Promise<Interest[]> => {
            try {
                const response = await apiClient.get<Interest[]>('/api/lists/interests');
                return response.data;
            } catch (error) {
                console.error('Failed to fetch interests:', error);
                throw error;
            }
        },
        getGoals: async (): Promise<Goal[]> => {
            try {
                const response = await apiClient.get<Goal[]>('/api/lists/goals');
                return response.data;
            } catch (error) {
                console.error('Failed to fetch goals:', error);
                throw error;
            }
        },
        getLanguageProficiencies: async (): Promise<LanguageProficiency[]> => {
            try {
                const response = await apiClient.get<LanguageProficiency[]>('/api/lists/language-proficiencies');
                return response.data;
            } catch (error) {
                console.error('Failed to fetch language proficiencies:', error);
                throw error;
            }
        },
        getDegrees: async (): Promise<DegreeType[]> => {
            try {
                const response = await apiClient.get<DegreeType[]>('/api/lists/degrees');
                return response.data;
            } catch (error) {
                console.error('Failed to fetch degrees:', error);
                throw error;
            }
        },
    },
};

export default api;

export type { User }; 