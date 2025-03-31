-- Drop indexes
DROP INDEX IF EXISTS idx_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_reviews_lesson_id;
DROP INDEX IF EXISTS idx_lessons_start_time;
DROP INDEX IF EXISTS idx_lessons_language_id;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_tutor_availability_tutor_id;
DROP INDEX IF EXISTS idx_user_goals_user_id;
DROP INDEX IF EXISTS idx_user_interests_user_id;
DROP INDEX IF EXISTS idx_user_languages_language_id;
DROP INDEX IF EXISTS idx_user_languages_user_id;
DROP INDEX IF EXISTS idx_users_role;

-- Drop triggers
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
DROP TRIGGER IF EXISTS update_tutor_availability_updated_at ON tutor_availability;
DROP TRIGGER IF EXISTS update_tutor_profiles_updated_at ON tutor_profiles;
DROP TRIGGER IF EXISTS update_student_profiles_updated_at ON student_profiles;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop tables in correct order
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS tutor_availability;
DROP TABLE IF EXISTS tutor_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS user_goals;
DROP TABLE IF EXISTS user_interests;
DROP TABLE IF EXISTS user_languages;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS interests;
DROP TABLE IF EXISTS language_proficiency;
DROP TABLE IF EXISTS languages;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the original schema (you would add this to restore the previous schema if needed)
-- The SQL statements to recreate the original schema would go here 