import { BaseEntity } from './common';
import { User } from './user';
import { UserLanguage, UserLanguageUpdate } from './language';

/**
 * Tutor-related types
 */

// Education entry structure
export interface Education {
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  documentUrl?: string;
}

// Tutor profile
export interface TutorProfile extends BaseEntity {
  user_id: number;
  bio: string;
  education: Education[];
  intro_video_url?: string;
  years_experience: number;
  created_at: string;
  updated_at: string;
  user?: User;
  languages?: UserLanguage[];
  rating?: number;
  reviews_count?: number;
}

// Tutor availability
export interface TutorAvailability extends BaseEntity {
  id: number;
  tutor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date?: string; // Format: "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

// Tutor registration
export interface TutorRegistrationRequest {
  username: string;
  password: string;
  email: string;
  bio: string;
  education: Education[];
  intro_video_url?: string;
  years_experience: number;
  languages: UserLanguageUpdate[];
}

// Tutor availability request
export interface TutorAvailabilityRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date?: string; // Format: "YYYY-MM-DD"
}

// Tutor update request
export interface TutorUpdateRequest {
  bio?: string;
  education?: Education[];
  intro_video_url?: string;
  years_experience?: number;
}

// Tutor search filters
export interface TutorSearchFilters {
  languages?: string[];
  proficiency_id?: number;       // Filter by minimum proficiency level
  interests?: number[];          // Filter by interests IDs
  goals?: number[];              // Filter by goals IDs
  years_experience?: number;     // Filter by minimum years of experience
  min_age?: number;              // Filter by minimum age
  max_age?: number;              // Filter by maximum age
  sex?: string;                  // Filter by sex (male, female)
}

export interface AvailableTimeSlot {
  id: number; // Related to availability ID
  start: Date;
  end: Date;
} 