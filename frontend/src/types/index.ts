export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export type SchedulePreset = 'weekdays' | 'weekends' | 'all_week' | 'mornings' | 'evenings' | 'custom';

export interface Language {
    name: string;
    level: LanguageLevel;
}

export interface TutorLanguage extends Language {
    is_native: boolean;
    can_teach: boolean;
}

export interface AvailabilitySlot {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    preset_type: SchedulePreset;
}

export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    role: string;
    gender?: Gender;
    native_language?: string;
    languages: Language[];
    interests: string[];
    learning_goals: string[];
    survey_complete: boolean;
    created_at: string;
    updated_at: string;
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

export interface ProfileUpdateData {
    first_name?: string;
    last_name?: string;
    gender?: Gender;
    profile_picture?: string;
    native_language?: string;
    languages?: Language[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete?: boolean;
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
    languages: TutorLanguage[];
    availability: AvailabilitySlot[];
}

export interface AuthResponse {
    token: string;
    user: User;
} 