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
  cancelled: boolean;
  created_at: string;
  updated_at: string;
} 