-- Drop triggers
DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;
DROP TRIGGER IF EXISTS update_user_personal_updated_at ON user_personal;
DROP TRIGGER IF EXISTS update_student_details_updated_at ON student_details;
DROP TRIGGER IF EXISTS update_tutor_details_updated_at ON tutor_details;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_user_credentials_username;
DROP INDEX IF EXISTS idx_user_credentials_email;
DROP INDEX IF EXISTS idx_user_credentials_role;
DROP INDEX IF EXISTS idx_user_personal_user_id;
DROP INDEX IF EXISTS idx_student_details_user_id;
DROP INDEX IF EXISTS idx_tutor_details_user_id;

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS challenge_completions;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS tutor_reviews;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS tutor_details;
DROP TABLE IF EXISTS student_details;
DROP TABLE IF EXISTS user_personal;
DROP TABLE IF EXISTS user_credentials;
DROP TABLE IF EXISTS languages;