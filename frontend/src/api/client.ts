import axios from 'axios';
import type { AxiosRequestConfig } from 'axios/index';
import type { LoginCredentials, RegisterData, ProfileUpdateData, TutorRegistrationData } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

console.log('API Client initialized with baseURL:', API_BASE_URL);

const apiClient = axios.create({
    baseURL: API_BASE_URL,
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

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || response.statusText);
    }
    return response.json();
}

export const api = {
    auth: {
        login: async (credentials: LoginCredentials) => {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(credentials),
            });
            return handleResponse(response);
        },
        register: async (data: RegisterData) => {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
    },
    user: {
        getProfile: async () => {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
            return handleResponse(response);
        },
        updateProfile: async (data: ProfileUpdateData) => {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        updatePassword: async (oldPassword: string, newPassword: string) => {
            const response = await fetch(`${API_BASE_URL}/users/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            return handleResponse(response);
        },
    },
    tutor: {
        register: async (data: TutorRegistrationData) => {
            const response = await fetch(`${API_BASE_URL}/tutors/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
    },
};

export default api; 