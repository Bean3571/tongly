import { notification } from 'antd';
import type { AxiosRequestConfig } from 'axios/index';
import { logger } from '../services/logger';
import {
    ApiError,
    ApiResponse,
    User,
    UserRole,
    UserRegistrationRequest,
    LoginRequest,
    AuthResponse,
    UserUpdateRequest,
    StudentRegistrationRequest,
    StudentUpdateRequest,
    TutorRegistrationRequest,
    TutorUpdateRequest,
    TutorAvailabilityRequest,
    TutorSearchFilters,
    Language,
    LanguageProficiency,
    Interest,
    Goal,
    Lesson,
    LessonBookingRequest,
    LessonCancellationRequest,
    Education
} from '../types';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

logger.info('API Client initialized with baseURL:', baseURL);

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
                        try {
                            const response = JSON.parse(xhr.responseText);
                            resolve({ data: response });
                        } catch (e) {
                            reject(new Error('Invalid response format'));
                        }
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed'));
                });

                xhr.addEventListener('abort', () => {
                    reject(new Error('Upload aborted'));
                });

                xhr.open('POST', `${this.baseUrl}${endpoint}`);
                
                const token = localStorage.getItem('token');
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
                
                xhr.send(formData);
            });
        } catch (error) {
            if (error instanceof Error) {
                this.showError({ message: error.message });
            }
            throw error;
        }
    }

    async downloadFile(endpoint: string, filename: string): Promise<void> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Download failed with status ${response.status}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
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

// Create a single instance of the API client
const apiClient = new ApiClient();

// API endpoints
export const api = {
    auth: {
        login: (credentials: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', credentials),
        register: (data: UserRegistrationRequest) => apiClient.post<AuthResponse>('/auth/register', data),
        registerStudent: (data: StudentRegistrationRequest) => apiClient.post<AuthResponse>('/auth/register/student', data),
        registerTutor: (data: TutorRegistrationRequest) => apiClient.post<AuthResponse>('/auth/register/tutor', data),
    },
    user: {
        getProfile: () => apiClient.get<User>('/user/profile'),
        updateProfile: (data: UserUpdateRequest) => apiClient.patch<User>('/user/profile', data),
        uploadProfilePicture: (file: File, onProgress?: (progress: number) => void) => 
            apiClient.uploadFile<{ url: string }>('/user/profile/picture', file, onProgress),
        updatePassword: (currentPassword: string, newPassword: string) => 
            apiClient.post<{ message: string }>('/user/password', {
                currentPassword,
                newPassword
            }),
    },
    student: {
        updateProfile: (data: StudentUpdateRequest) => apiClient.patch<User>('/student/profile', data),
    },
    tutor: {
        getProfile: (tutorId: number) => apiClient.get<User>(`/tutors/${tutorId}`),
        updateProfile: (data: TutorUpdateRequest) => apiClient.patch<User>('/tutor/profile', data),
        uploadVideo: (file: File, onProgress?: (progress: number) => void) => 
            apiClient.uploadFile<{ url: string }>('/tutor/video', file, onProgress),
        addAvailability: (data: TutorAvailabilityRequest) => apiClient.post('/tutor/availability', data),
        getAvailability: () => apiClient.get('/tutor/availability'),
        deleteAvailability: (id: number) => apiClient.delete(`/tutor/availability/${id}`),
        search: (filters?: TutorSearchFilters) => apiClient.get<User[]>('/tutors', filters as any),
    },
    lessons: {
        getUpcoming: () => apiClient.get<Lesson[]>('/lessons/upcoming'),
        getPast: () => apiClient.get<Lesson[]>('/lessons/past'),
        book: (data: LessonBookingRequest) => apiClient.post<Lesson>('/lessons', data),
        cancel: (lessonId: number, data: LessonCancellationRequest) => apiClient.post(`/lessons/${lessonId}/cancel`, data),
        getLesson: (lessonId: number) => apiClient.get<Lesson>(`/lessons/${lessonId}`),
    },
    reference: {
        getLanguages: () => apiClient.get<Language[]>('/reference/languages'),
        getProficiencies: () => apiClient.get<LanguageProficiency[]>('/reference/proficiencies'),
        getInterests: () => apiClient.get<Interest[]>('/reference/interests'),
        getGoals: () => apiClient.get<Goal[]>('/reference/goals'),
    }
};

// Video upload response type
export interface VideoUploadResponse {
    message: string;
    videoUrl: string;
} 