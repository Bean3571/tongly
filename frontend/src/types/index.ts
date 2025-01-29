export interface User {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    role: string;
    age?: number;
    gender?: Gender;
    native_language?: string;
    languages?: LanguageLevel[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete: boolean;
    created_at: string;
    updated_at: string;
}

export type Gender = 'male' | 'female' | 'not_selected';

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
    gender?: Gender | null;
    native_language?: string | null;
    languages?: LanguageLevel[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete?: boolean;
}

export interface TutorProfile {
    id: number;
    user_id: number;
    bio: string;
    education: string[];
    certificates: string[];
    teaching_experience: string;
    hourly_rate: number;
    schedule_preset: SchedulePreset;
    min_lesson_duration: number;
    max_students: number;
    trial_lesson_available: boolean;
    trial_lesson_price: number | null;
    languages: TutorLanguage[];
    availability: AvailabilitySlot[];
    created_at: string;
    updated_at: string;
}

export interface TutorLanguage extends LanguageLevel {
    is_native: boolean;
    can_teach: boolean;
}

export type SchedulePreset = 'weekdays' | 'weekends' | 'all_week' | 'mornings' | 'evenings' | 'custom';

export interface AvailabilitySlot {
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    preset_type: SchedulePreset;
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