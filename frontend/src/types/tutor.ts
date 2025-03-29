export interface Language {
  language: string;
  level: string;
}

export interface Education {
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  documentUrl?: string;
}

export interface TutorProfileUpdateRequest {
  teachingLanguages: Language[];
  education: Education[];
  interests: string[];
  hourlyRate: number;
  bio: string;
  offersTrial: boolean;
  introductionVideo: string;
}

export const LANGUAGE_LEVELS = [
  'Upper Intermediate (B2)',
  'Advanced (C1)',
  'Mastery (C2)',
  'Native'
] as const;

export type LanguageLevel = typeof LANGUAGE_LEVELS[number];

export interface TutorProfile {
    id: string;
    name: string;
    bio: string;
    education: string;
    languages: string[];
    rating: number;
    totalLessons: number;
    avatarUrl: string;
} 