import axios, { AxiosError } from 'axios';
import { User, LoginRequest, UserRegistrationRequest, UserUpdateRequest, AuthResponse } from '../types';
import { Language, LanguageProficiency, UserLanguage, UserLanguageUpdate } from '../types/language';
import { Interest, UserInterest, Goal, UserGoal } from '../types/interest-goal';
import { TutorProfile, TutorUpdateRequest } from '../types/tutor';

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
            const response = await apiClient.get('/api/user/profile');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    },

    updateProfile: async (data: UserUpdateRequest): Promise<User> => {
        try {
            const response = await apiClient.put('/api/user/profile', data);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    },

    updatePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
        try {
            await apiClient.put('/api/user/password', { 
                current_password: currentPassword, 
                new_password: newPassword 
            });
        } catch (error) {
            console.error('Update password error:', error);
            throw error;
        }
    }
};

// Language Service
export const languageService = {
    getAllLanguages: async (): Promise<Language[]> => {
        try {
            const response = await apiClient.get('/api/languages');
            return response.data || [];
        } catch (error) {
            console.error('Get languages error:', error);
            return [];
        }
    },

    getAllProficiencies: async (): Promise<LanguageProficiency[]> => {
        try {
            const response = await apiClient.get('/api/language-proficiencies');
            return response.data || [];
        } catch (error) {
            console.error('Get proficiencies error:', error);
            return [];
        }
    },

    getUserLanguages: async (): Promise<UserLanguage[]> => {
        try {
            const response = await apiClient.get('/api/users/me/languages');
            return response.data || [];
        } catch (error) {
            console.error('Get user languages error:', error);
            return [];
        }
    },

    addUserLanguage: async (data: UserLanguageUpdate): Promise<UserLanguage> => {
        try {
            const response = await apiClient.post('/api/users/me/languages', data);
            return response.data;
        } catch (error) {
            console.error('Add user language error:', error);
            throw error;
        }
    },

    updateUserLanguage: async (languageId: number, data: UserLanguageUpdate): Promise<UserLanguage> => {
        try {
            const response = await apiClient.put(`/api/users/me/languages/${languageId}`, data);
            return response.data;
        } catch (error) {
            console.error('Update user language error:', error);
            throw error;
        }
    },

    deleteUserLanguage: async (languageId: number): Promise<void> => {
        try {
            await apiClient.delete(`/api/users/me/languages/${languageId}`);
        } catch (error) {
            console.error('Delete user language error:', error);
            throw error;
        }
    }
};

// Interest Service
export const interestService = {
    getAllInterests: async (): Promise<Interest[]> => {
        try {
            const response = await apiClient.get('/api/interests');
            return response.data || [];
        } catch (error) {
            console.error('Get interests error:', error);
            return [];
        }
    },

    getUserInterests: async (): Promise<UserInterest[]> => {
        try {
            const response = await apiClient.get('/api/users/me/interests');
            return response.data || [];
        } catch (error) {
            console.error('Get user interests error:', error);
            return [];
        }
    },

    addUserInterest: async (interestId: number): Promise<UserInterest> => {
        try {
            const response = await apiClient.post('/api/users/me/interests', { interest_id: interestId });
            return response.data;
        } catch (error) {
            console.error('Add user interest error:', error);
            throw error;
        }
    },

    deleteUserInterest: async (interestId: number): Promise<void> => {
        try {
            await apiClient.delete(`/api/users/me/interests/${interestId}`);
        } catch (error) {
            console.error('Delete user interest error:', error);
            throw error;
        }
    }
};

// Goal Service
export const goalService = {
    getAllGoals: async (): Promise<Goal[]> => {
        try {
            const response = await apiClient.get('/api/goals');
            return response.data || [];
        } catch (error) {
            console.error('Get goals error:', error);
            return [];
        }
    },

    getUserGoals: async (): Promise<UserGoal[]> => {
        try {
            const response = await apiClient.get('/api/users/me/goals');
            return response.data || [];
        } catch (error) {
            console.error('Get user goals error:', error);
            return [];
        }
    },

    addUserGoal: async (goalId: number): Promise<UserGoal> => {
        try {
            const response = await apiClient.post('/api/users/me/goals', { goal_id: goalId });
            return response.data;
        } catch (error) {
            console.error('Add user goal error:', error);
            throw error;
        }
    },

    deleteUserGoal: async (goalId: number): Promise<void> => {
        try {
            await apiClient.delete(`/api/users/me/goals/${goalId}`);
        } catch (error) {
            console.error('Delete user goal error:', error);
            throw error;
        }
    }
};

// Tutor Service
export const tutorService = {
    getTutorProfile: async (): Promise<TutorProfile> => {
        try {
            const response = await apiClient.get('/api/tutors/me/profile');
            return response.data;
        } catch (error) {
            console.error('Get tutor profile error:', error);
            throw error;
        }
    },

    updateTutorProfile: async (data: TutorUpdateRequest): Promise<TutorProfile> => {
        try {
            const response = await apiClient.put('/api/tutors/me/profile', data);
            return response.data;
        } catch (error) {
            console.error('Update tutor profile error:', error);
            throw error;
        }
    }
};

export default {
    auth: authService,
    user: userService,
    language: languageService,
    interest: interestService,
    goal: goalService,
    tutor: tutorService
}; 