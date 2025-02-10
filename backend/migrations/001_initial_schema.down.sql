-- Drop triggers
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
DROP TRIGGER IF EXISTS update_tutor_details_updated_at ON tutor_details;
DROP TRIGGER IF EXISTS update_student_details_updated_at ON student_details;
DROP TRIGGER IF EXISTS update_user_personal_updated_at ON user_personal;
DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS lesson_ratings;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS video_sessions;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS student_details;
DROP TABLE IF EXISTS tutor_details;
DROP TABLE IF EXISTS user_personal;
DROP TABLE IF EXISTS user_credentials;