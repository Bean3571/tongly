-- Drop indexes
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_lessons_start_time;
DROP INDEX IF EXISTS idx_lessons_status;
DROP INDEX IF EXISTS idx_chat_messages_lesson_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_lesson_ratings_lesson_id;

-- Drop tables in correct order due to foreign key constraints
DROP TABLE IF EXISTS lesson_ratings;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS video_sessions;
DROP TABLE IF EXISTS lessons; 