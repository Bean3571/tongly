-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_tutors_updated_at ON tutors;
DROP TRIGGER IF EXISTS update_tutor_profiles_updated_at ON tutor_profiles;
DROP TRIGGER IF EXISTS update_tutor_availability_updated_at ON tutor_availability;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_users_username;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_user_profiles_user_id;
DROP INDEX IF EXISTS idx_user_profiles_native_language;
DROP INDEX IF EXISTS idx_tutors_user_id;
DROP INDEX IF EXISTS idx_tutors_approval_status;
DROP INDEX IF EXISTS idx_tutor_profiles_tutor_id;
DROP INDEX IF EXISTS idx_tutor_availability_tutor_id;
DROP INDEX IF EXISTS idx_tutor_availability_day_time;
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_tutor_reviews_tutor_id;
DROP INDEX IF EXISTS idx_tutor_reviews_student_id;
DROP INDEX IF EXISTS idx_tutor_reviews_lesson_id;

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS challenge_completions;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS tutor_reviews;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS tutor_availability;
DROP TABLE IF EXISTS tutor_profiles;
DROP TABLE IF EXISTS tutors;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS users;