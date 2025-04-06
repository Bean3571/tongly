-- Drop indexes
DROP INDEX IF EXISTS idx_lessons_session_id;
DROP INDEX IF EXISTS idx_video_call_events_user_id;
DROP INDEX IF EXISTS idx_video_call_events_lesson_id;

-- Drop video call events table
DROP TABLE IF EXISTS video_call_events;

-- Remove video call related fields from lessons table
ALTER TABLE lessons DROP COLUMN IF EXISTS session_id;
ALTER TABLE lessons DROP COLUMN IF EXISTS join_token_student;
ALTER TABLE lessons DROP COLUMN IF EXISTS join_token_tutor; 