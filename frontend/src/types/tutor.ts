export interface Language {
  language: string;
  level: string;
}

export interface Degree {
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  fieldOfStudy: string;
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