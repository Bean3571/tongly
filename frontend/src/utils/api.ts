import axios from 'axios';
import { envConfig } from '../config/env';

// Normalize API URL to prevent duplicate '/api' in paths
const normalizeApiUrl = (url: string): string => {
    // Remove trailing slash if present
    const trimmedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    
    // If URL already ends with /api, don't add it again in the paths
    return trimmedUrl;
};

// Create axios instance with proper configuration
export const api = axios.create({
    baseURL: normalizeApiUrl(envConfig.apiUrl),
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Retry on network errors or 5xx server errors (up to 3 times)
        if (
            (error.code === 'ECONNABORTED' || 
            (error.response && error.response.status >= 500)) && 
            !originalRequest._retry && 
            (originalRequest._retryCount || 0) < 3
        ) {
            originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
            
            // Exponential backoff
            const delay = Math.pow(2, originalRequest._retryCount) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return api(originalRequest);
        }
        
        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._refresh) {
            originalRequest._refresh = true;

            try {
                // Try to refresh the token
                const response = await axios.post(
                    `${normalizeApiUrl(envConfig.apiUrl)}/auth/refresh`, 
                    {}, 
                    { 
                        withCredentials: true,
                        headers: { 
                            Authorization: `Bearer ${localStorage.getItem('token')}` 
                        } 
                    }
                );
                
                const { token } = response.data;
                
                if (token) {
                    localStorage.setItem('token', token);
                    
                    // Update the authorization header for future requests
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    
                    // Update the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    
                    // Retry the original request with the new token
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                
                // If refresh fails, clear token and redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login?session=expired';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

// Helper functions for common API operations
export const apiService = {
    get: <T>(url: string, params = {}) => 
        api.get<T>(url, { params }).then(response => response.data),
        
    post: <T>(url: string, data = {}) => 
        api.post<T>(url, data).then(response => response.data),
        
    put: <T>(url: string, data = {}) => 
        api.put<T>(url, data).then(response => response.data),
        
    delete: <T>(url: string) => 
        api.delete<T>(url).then(response => response.data),
};

export default apiService; 