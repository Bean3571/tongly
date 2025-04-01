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

-- Drop new schema
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

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create simple tables (for compatibility with legacy code)
CREATE TABLE user_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('student', 'tutor', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_personal (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    profile_picture_url VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES user_credentials(id) ON DELETE CASCADE
);

CREATE TABLE tutor_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    bio TEXT,
    teaching_languages JSONB,
    education JSONB,
    introduction_video VARCHAR(255),
    interests JSONB,
    FOREIGN KEY (user_id) REFERENCES user_credentials(id) ON DELETE CASCADE
);

CREATE TABLE student_details (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    learning_languages JSONB,
    interests JSONB,
    FOREIGN KEY (user_id) REFERENCES user_credentials(id) ON DELETE CASCADE
);

-- Recreate the original schema (you would add this to restore the previous schema if needed)
-- The SQL statements to recreate the original schema would go here 