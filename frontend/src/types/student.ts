import { BaseEntity } from './common';
import { User } from './user';
import { UserGoal } from './interest-goal';
import { UserInterest } from './interest-goal';
import { UserLanguage, UserLanguageUpdate } from './language';

/**
 * Student-related types
 */

// Student profile
export interface StudentProfile extends BaseEntity {
  user_id: number;
  current_streak: number;
  longest_streak: number;
  user?: User;
  languages?: UserLanguage[];
  interests?: UserInterest[];
  goals?: UserGoal[];
}

// Student registration
export interface StudentRegistrationRequest {
  username: string;
  password: string; // For frontend usability
  email: string;
  languages?: UserLanguageUpdate[];
  interests?: number[];
  goals?: number[];
}

// Student update request
export interface StudentUpdateRequest {
  profile_picture_url?: string;
  languages?: UserLanguageUpdate[];
  interests?: number[];
  goals?: number[];
} 