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
  session_id?: string;
  join_token_student?: string;
  join_token_tutor?: string;
  
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

// Video call session response
export interface VideoCallSessionResponse {
  session_id: string;
  token: string;
  lesson_id: number;
  student: {
    id: number;
    first_name: string;
    last_name: string;
  };
  tutor: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

// Video call event types
export enum VideoCallEventType {
  JOINED = 'joined',
  LEFT = 'left',
  MIC_TOGGLED = 'mic_toggled',
  CAMERA_TOGGLED = 'camera_toggled',
  SCREENSHARE_STARTED = 'screenshare_started',
  SCREENSHARE_ENDED = 'screenshare_ended',
  VIEW_CHANGED = 'view_changed',
}

// Video call event request
export interface VideoCallEventRequest {
  event_type: VideoCallEventType;
  event_data?: Record<string, any>;
}

// Video call participant view options
export enum VideoCallViewType {
  PARTICIPANT_CAMERA = 'participant_camera',
  PARTICIPANT_SCREEN = 'participant_screen',
  MY_SCREEN = 'my_screen',
} 