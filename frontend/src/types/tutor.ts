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
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  documentUrl?: string;
}

// Tutor profile
export interface TutorProfile extends BaseEntity {
  userId: number;
  bio: string;
  education: Education[];
  introVideoUrl?: string;
  approved: boolean;
  yearsExperience: number;
  user?: User;
  languages?: UserLanguage[];
}

// Tutor availability
export interface TutorAvailability extends BaseEntity {
  id: number;
  tutorId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

// Tutor registration
export interface TutorRegistrationRequest {
  username: string;
  password: string; // Changed from passwordHash for frontend
  email: string;
  bio: string;
  education: Education[];
  introVideoUrl?: string;
  yearsExperience: number;
  languages: UserLanguageUpdate[];
}

// Tutor availability request
export interface TutorAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

// Tutor update request
export interface TutorUpdateRequest {
  bio?: string;
  education?: Education[];
  introVideoUrl?: string;
  yearsExperience?: number;
}

// Tutor search filters
export interface TutorSearchFilters {
  languages?: string[];
} 