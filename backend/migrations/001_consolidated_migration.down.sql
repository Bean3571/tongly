-- Drop indexes
DROP INDEX IF EXISTS idx_reviews_reviewer_id;
DROP INDEX IF EXISTS idx_reviews_lesson_id;
DROP INDEX IF EXISTS idx_lessons_start_time;
DROP INDEX IF EXISTS idx_lessons_language_id;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_tutor_availability_tutor_date;
DROP INDEX IF EXISTS idx_tutor_availability_specific_date;
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

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order of creation (respect foreign key constraints)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS tutor_availability CASCADE;
DROP TABLE IF EXISTS tutor_profiles CASCADE;
DROP TABLE IF EXISTS student_profiles CASCADE;
DROP TABLE IF EXISTS user_goals CASCADE;
DROP TABLE IF EXISTS user_interests CASCADE;
DROP TABLE IF EXISTS user_languages CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS interests CASCADE;
DROP TABLE IF EXISTS language_proficiency CASCADE;
DROP TABLE IF EXISTS languages CASCADE; 