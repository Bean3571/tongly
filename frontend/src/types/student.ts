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
  userId: number;
  currentStreak: number;
  longestStreak: number;
  user?: User;
  languages?: UserLanguage[];
  interests?: UserInterest[];
  goals?: UserGoal[];
}

// Student registration
export interface StudentRegistrationRequest {
  username: string;
  password: string; // Changed from passwordHash for frontend
  email: string;
  languages?: UserLanguageUpdate[];
  interests?: number[];
  goals?: number[];
}

// Student update request
export interface StudentUpdateRequest {
  profilePictureUrl?: string;
  languages?: UserLanguageUpdate[];
  interests?: number[];
  goals?: number[];
} 