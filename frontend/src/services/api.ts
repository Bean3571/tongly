import axios from 'axios';
import { User, LoginCredentials, RegisterData, ProfileUpdateData } from '../types';
import { Lesson } from '../types/lesson';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
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
        await apiClient.put('/api/profile/password', { current_password: oldPassword, new_password: newPassword });
    }
};

export interface RoomParticipant {
    id: number;
    lesson_id: number;
    user_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    joined_at: string;
    left_at?: string;
}

export interface RoomInfo {
    room_id: string;
    token: string;
    participants: RoomParticipant[];
}

// Lesson Service
export const lessonService = {
    getLessons: async (): Promise<Lesson[]> => {
        try {
            const [upcomingResponse, completedResponse] = await Promise.all([
                apiClient.get('/api/lessons/upcoming'),
                apiClient.get('/api/lessons/completed')
            ]);
            
            const upcomingLessons = Array.isArray(upcomingResponse.data) ? upcomingResponse.data : [];
            const completedLessons = Array.isArray(completedResponse.data) ? completedResponse.data : [];
            
            const allLessons = [...upcomingLessons, ...completedLessons];
            console.log('All lessons:', allLessons);
            return allLessons;
        } catch (error) {
            console.error('Error fetching lessons:', error);
            throw error;
        }
    },

    getLesson: async (lessonId: number): Promise<Lesson> => {
        const response = await apiClient.get(`/api/lessons/${lessonId}`);
        console.log('Lesson data from API:', response.data);
        return response.data;
    },

    cancelLesson: async (lessonId: number): Promise<void> => {
        await apiClient.post(`/api/lessons/${lessonId}/cancel`);
    },

    joinLesson: async (lessonId: number): Promise<RoomInfo> => {
        const response = await apiClient.post<RoomInfo>(`/api/lessons/${lessonId}/room/join`);
        return response.data;
    },

    getRoomInfo: async (lessonId: number): Promise<RoomInfo> => {
        const response = await apiClient.get<RoomInfo>(`/api/lessons/${lessonId}/room`);
        return response.data;
    },

    leaveLesson: async (lessonId: number): Promise<void> => {
        await apiClient.post(`/api/lessons/${lessonId}/room/leave`);
    }
};

export default {
    auth: authService,
    user: userService,
    lesson: lessonService
}; 