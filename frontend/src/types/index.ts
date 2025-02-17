export interface User {
    credentials: UserCredentials;
    personal?: UserPersonal;
    student?: StudentDetails;
    tutor?: TutorDetails;
}

export interface UserCredentials {
    id: number;
    username: string;
    email: string;
    role: string;
}

export interface UserPersonal {
    id: number;
    user_id: number;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    age?: number | null;
    sex?: 'male' | 'female' | 'other' | null;
}

export interface StudentDetails {
    id: number;
    user_id: number;
    learning_languages: LanguageLevel[];
    learning_goals: string[];
    interests: string[];
}

export interface TutorDetails {
    id: number;
    user_id: number;
    bio: string;
    native_languages: string[];
    teaching_languages: LanguageLevel[];
    degrees: Degree[];
    interests: string[];
    hourly_rate: number;
    introduction_video: string;
    offers_trial: boolean;
    approved: boolean;
}

export interface LanguageLevel {
    language: string;
    level: string;
}

export interface Degree {
    degree: string;
    institution: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
}

export const Languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Chinese',
    'Japanese',
    'Korean',
    'Russian',
    'Arabic',
    'Portuguese',
    'Italian',
] as const;

export const LanguageLevels = [
    'A1',
    'A2',
    'B1',
    'B2',
    'C1',
    'C2',
] as const;

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

export interface ProfileUpdateData {
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    profile_picture?: string | null;
    age?: number | null;
    sex?: 'male' | 'female' | 'other' | null;
    languages?: LanguageLevel[];
    interests?: string[];
    learning_goals?: string[];
    survey_complete?: boolean;
} 