DROP INDEX IF EXISTS idx_platform_earnings_transaction;
DROP INDEX IF EXISTS idx_transaction_currency;
DROP INDEX IF EXISTS idx_wallet_transactions_type;
DROP INDEX IF EXISTS idx_wallet_transactions_status;
DROP INDEX IF EXISTS idx_wallet_transactions_user_id;
DROP INDEX IF EXISTS idx_lessons_price;
DROP INDEX IF EXISTS idx_lessons_language;
DROP INDEX IF EXISTS idx_lessons_status;
DROP INDEX IF EXISTS idx_lessons_end_time;
DROP INDEX IF EXISTS idx_lessons_start_time;
DROP INDEX IF EXISTS idx_lessons_tutor_id;
DROP INDEX IF EXISTS idx_lessons_student_id;
DROP INDEX IF EXISTS idx_tutor_details_approved;
DROP INDEX IF EXISTS idx_tutor_details_hourly_rate;
DROP INDEX IF EXISTS idx_tutor_details_user_id;
DROP INDEX IF EXISTS idx_student_details_user_id;
DROP INDEX IF EXISTS idx_user_personal_user_id;
DROP INDEX IF EXISTS idx_user_credentials_role;
DROP INDEX IF EXISTS idx_user_credentials_email;
DROP INDEX IF EXISTS idx_user_credentials_username;

-- Drop triggers
DROP TRIGGER IF EXISTS update_tutor_details_updated_at ON tutor_details;
DROP TRIGGER IF EXISTS update_student_details_updated_at ON student_details;
DROP TRIGGER IF EXISTS update_user_personal_updated_at ON user_personal;
DROP TRIGGER IF EXISTS update_user_credentials_updated_at ON user_credentials;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables
DROP TABLE IF EXISTS platform_earnings;
DROP TABLE IF EXISTS wallet_transactions;
DROP TABLE IF EXISTS lessons;
DROP TABLE IF EXISTS tutor_details;
DROP TABLE IF EXISTS student_details;
DROP TABLE IF EXISTS user_personal;
DROP TABLE IF EXISTS user_credentials; 