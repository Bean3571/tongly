-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_tutors_updated_at ON tutors;
DROP TRIGGER IF EXISTS update_tutor_availability_updated_at ON tutor_availability;
DROP TRIGGER IF EXISTS update_tutor_reviews_updated_at ON tutor_reviews;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in correct order (respecting foreign key dependencies)
DROP TABLE IF EXISTS challenge_completions;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS tutor_reviews;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS availability_slots;
DROP TABLE IF EXISTS tutor_availability;
DROP TABLE IF EXISTS tutor_languages;
DROP TABLE IF EXISTS tutors;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;