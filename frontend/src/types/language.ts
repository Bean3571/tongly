import { BaseEntity } from './common';

/**
 * Language-related types
 */

// Language model
export interface Language extends BaseEntity {
  id: number;
  name: string;
}

// Language proficiency level
export interface LanguageProficiency extends BaseEntity {
  id: number;
  name: string;
}

// User's language proficiency 
export interface UserLanguage extends BaseEntity {
  userId: number;
  languageId: number;
  proficiencyId: number;
  language?: Language;
  proficiency?: LanguageProficiency;
}

// Language update for user profile
export interface UserLanguageUpdate {
  languageId: number;
  proficiencyId: number;
} 