export enum LessonStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Lesson {
  id: number;
  student_id: number;
  tutor_id: number;
  student: {
    first_name?: string;
    last_name?: string;
    username: string;
    avatar_url?: string;
  };
  tutor: {
    first_name?: string;
    last_name?: string;
    username: string;
    avatar_url?: string;
  };
  start_time: string;
  end_time: string;
  duration: number;
  language: string;
  price: number;
  status: LessonStatus;
  created_at: string;
  updated_at: string;
} 