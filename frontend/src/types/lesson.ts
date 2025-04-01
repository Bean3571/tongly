import { BaseEntity } from './common';
import { User } from './user';
import { Language } from './language';

/**
 * Lesson-related types
 */

// Lesson status enum
export enum LessonStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Review model
export interface Review extends BaseEntity {
  id: number;
  lessonId: number;
  reviewerId: number;
  rating: number;
  reviewer?: User;
}

// Lesson model
export interface Lesson extends BaseEntity {
  id: number;
  studentId: number;
  tutorId: number;
  languageId: number;
  startTime: string;
  endTime: string;
  cancelledBy?: number;
  cancelledAt?: string;
  notes?: string;
  
  // Related entities
  student?: User;
  tutor?: User;
  language?: Language;
  reviews?: Review[];
  
  // Virtual property (not from backend)
  status?: LessonStatus;
}

// Lesson booking request
export interface LessonBookingRequest {
  tutorId: number;
  languageId: number;
  startTime: string;
  endTime: string;
  notes?: string;
}

// Lesson cancellation request
export interface LessonCancellationRequest {
  reason: string;
} 