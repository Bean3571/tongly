import axios from 'axios';
import type { AxiosRequestConfig } from 'axios/index';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API endpoints interface
export const api = {
    auth: {
        login: async (credentials: { username: string; password: string }) => {
            const response = await apiClient.post<{ token: string }>('/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response;
        },
        register: (data: { username: string; password: string; email: string; role: string }) =>
            apiClient.post('/auth/register', data),
    },
    user: {
        getProfile: () => apiClient.get('/profile'),
        updateProfile: (data: { email?: string; profilePicture?: string }) =>
            apiClient.put('/profile', data),
        updatePassword: (data: { currentPassword: string; newPassword: string }) =>
            apiClient.put('/profile/password', data),
    },
};

export default api; 