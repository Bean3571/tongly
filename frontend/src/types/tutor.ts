export interface Language {
  language: string;
  level: string;
}

export interface Degree {
  degree: string;
  institution: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  documentUrl?: string;
}

export interface TutorProfileUpdateRequest {
  nativeLanguages: string[];
  teachingLanguages: Language[];
  degrees: Degree[];
  interests: string[];
  hourlyRate: number;
  bio: string;
  offersTrial: boolean;
  introductionVideo: string;
} 