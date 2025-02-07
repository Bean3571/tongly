export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    profile?: UserProfile;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: number;
    user_id: number;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    age?: number | null;
    sex?: 'male' | 'female' | 'other' | null;
    native_language?: string | null;
    languages: LanguageLevel[];
    interests: string[];
    learning_goals: string[];
    survey_complete: boolean;
}

export type LearningGoal = 
    | 'business'
    | 'job'
    | 'study'
    | 'trip'
    | 'migration'
    | 'exams'
    | 'culture'
    | 'friends'
    | 'hobby';

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    role: string;
}

export interface LanguageLevel {
    language: string;
    level: string;
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