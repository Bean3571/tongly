export type SchedulePreset = "weekdays" | "weekends" | "flexible" | "custom";

export interface AvailabilitySlot {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    preset_type: SchedulePreset;
}

export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native";

export interface BaseLanguage {
    language: string;
    level: LanguageLevel;
}

export interface Language extends BaseLanguage {}

export interface TutorLanguage extends BaseLanguage {
    is_native: boolean;
    can_teach: boolean;
}

export interface TutorRegistrationData {
    bio: string;
    education: string[];
    certificates: string[];
    teaching_experience: string;
    hourly_rate: number;
    schedule_preset: SchedulePreset;
    min_lesson_duration: number;
    max_students: number;
    trial_lesson_available: boolean;
    trial_lesson_price?: number;
    description: string;
    languages: TutorLanguage[];
    availability: AvailabilitySlot[];
}

export interface TutorProfile extends TutorRegistrationData {
    id?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface User {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    gender?: Gender;
    languages: Language[];
    interests: string[];
    learning_goals: string[];
    survey_complete: boolean;
    created_at: string;
    updated_at: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

export interface ProfileUpdateData {
    first_name?: string;
    last_name?: string;
    gender?: string;
    languages?: Language[];
    interests?: string[];
    learning_goals?: string[];
}

export interface AuthContextType {
    user: any;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: any) => Promise<void>;
    refreshUser: () => Promise<void>;
} 
