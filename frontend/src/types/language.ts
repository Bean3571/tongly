import { BaseEntity } from './common';

/**
 * Language-related types
 */

// Language model
export interface Language {
  id: number;
  name: string;
  created_at: string;
}

// Language proficiency level
export interface LanguageProficiency {
  id: number;
  name: string;
  created_at: string;
}

// User's language proficiency 
export interface UserLanguage {
  user_id: number;
  language_id: number;
  proficiency_id: number;
  language?: Language;
  proficiency?: LanguageProficiency;
  created_at: string;
}

// Language update for user profile
export interface UserLanguageUpdate {
  language_id: number;
  proficiency_id: number;
} 