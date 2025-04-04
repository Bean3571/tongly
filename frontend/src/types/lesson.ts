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
  lesson_id: number;
  reviewer_id: number;
  rating: number;
  reviewer?: User;
}

// Lesson model
export interface Lesson extends BaseEntity {
  id: number;
  student_id: number;
  tutor_id: number;
  language_id: number;
  start_time: string;
  end_time: string;
  cancelled_by?: number;
  cancelled_at?: string;
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
  tutor_id: number;
  language_id: number;
  start_time: string;
  end_time: string;
  notes?: string;
}

// Lesson cancellation request
export interface LessonCancellationRequest {
  reason: string;
} 