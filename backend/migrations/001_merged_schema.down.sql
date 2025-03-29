DROP INDEX IF EXISTS idx_user_credentials_email;
DROP INDEX IF EXISTS idx_user_credentials_username;
DROP INDEX IF EXISTS idx_tutor_profiles_user_id;
DROP INDEX IF EXISTS idx_tutor_profiles_language;
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_lessons_start_time;
DROP INDEX IF EXISTS idx_lessons_status;
DROP INDEX IF EXISTS idx_lessons_language;

-- Drop views
DROP VIEW IF EXISTS lesson_participants;

-- Drop tables
DROP TABLE IF EXISTS tutor_languages;
DROP TABLE IF EXISTS tutor_schedules;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS tutor_profiles;
DROP TABLE IF EXISTS tutor_availability;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_credentials;

-- Drop extensions
DROP EXTENSION IF EXISTS "uuid-ossp";