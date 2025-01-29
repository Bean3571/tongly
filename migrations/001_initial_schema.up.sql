<<<<<<< Updated upstream
=======
-- Users table (already exists, shown for reference)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_picture TEXT,
    role VARCHAR(50) NOT NULL,
    age INTEGER,
    native_language VARCHAR(50),
    languages JSONB DEFAULT '[]'::jsonb,
    interests TEXT[] DEFAULT ARRAY[]::TEXT[],
    learning_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    survey_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_native_language ON users(native_language);
CREATE INDEX idx_users_survey_complete ON users(survey_complete);

>>>>>>> Stashed changes
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    profile_picture VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    age INT,
    gender VARCHAR(20),
    native_language VARCHAR(50),
    languages JSONB DEFAULT '[]',
    interests TEXT[] DEFAULT '{}',
    learning_goals TEXT[] DEFAULT '{}',
    survey_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_native_language ON users(native_language);
CREATE INDEX idx_users_survey_complete ON users(survey_complete);
CREATE INDEX idx_users_gender ON users(gender);

-- Trigger to update users.updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tutors table
CREATE TABLE tutors (
    id SERIAL PRIMARY KEY,
<<<<<<< Updated upstream
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT NOT NULL,
    education JSONB NOT NULL DEFAULT '[]',
    certificates JSONB NOT NULL DEFAULT '[]',
    teaching_experience TEXT NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    schedule_preset VARCHAR(20) NOT NULL,
    min_lesson_duration INTEGER NOT NULL,
    max_students INTEGER NOT NULL,
    trial_available BOOLEAN NOT NULL DEFAULT false,
    trial_price DECIMAL(10,2),
    languages JSONB NOT NULL DEFAULT '[]',
    availability JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tutors_user_id_unique UNIQUE (user_id),
    CONSTRAINT tutors_hourly_rate_check CHECK (hourly_rate > 0),
    CONSTRAINT tutors_min_lesson_duration_check CHECK (min_lesson_duration IN (30, 45, 60, 90, 120)),
    CONSTRAINT tutors_max_students_check CHECK (max_students BETWEEN 1 AND 5),
    CONSTRAINT tutors_trial_price_check CHECK (trial_price IS NULL OR trial_price >= 0)
);

CREATE INDEX tutors_hourly_rate_idx ON tutors (hourly_rate);
CREATE INDEX tutors_schedule_preset_idx ON tutors (schedule_preset);

-- Trigger to update tutors.updated_at
CREATE TRIGGER update_tutors_updated_at 
    BEFORE UPDATE ON tutors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Lessons table
=======
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    hourly_rate DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tutor languages (many-to-many relationship)
CREATE TABLE tutor_languages (
    tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
    language_id INTEGER REFERENCES languages(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) NOT NULL CHECK (proficiency_level IN ('native', 'fluent', 'advanced', 'intermediate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tutor_id, language_id)
);

-- Availability slots
CREATE TABLE availability_slots (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lessons
>>>>>>> Stashed changes
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lessons_duration_check CHECK (duration IN (30, 45, 60, 90, 120))
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5)
);

-- Wallet transactions table
CREATE TABLE wallet_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points INTEGER NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    duration_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Challenge completions table
CREATE TABLE challenge_completions (
    id SERIAL PRIMARY KEY,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    points_earned INTEGER NOT NULL,
    UNIQUE (challenge_id, user_id)
); 