export type SchedulePreset = 'weekdays' | 'weekends' | 'all_week' | 'mornings' | 'evenings' | 'custom';

export interface AvailabilitySlot {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_recurring: boolean;
    preset_type: SchedulePreset;
}

export interface TutorLanguage extends LanguageLevel {
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
    languages: TutorLanguage[];
    availability: AvailabilitySlot[];
}

export type LanguageLevel = {
    language: string;
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';
}; 
