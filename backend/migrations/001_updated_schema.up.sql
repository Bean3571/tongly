-- Drop old schema
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS tutor_details CASCADE;
DROP TABLE IF EXISTS student_details CASCADE;
DROP TABLE IF EXISTS user_personal CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP VIEW IF EXISTS lesson_participants CASCADE;

-- Table: languages
CREATE TABLE languages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: language_proficiency
CREATE TABLE language_proficiency (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: interests
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: goals
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    profile_picture_url VARCHAR(255),
    sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'not_set')) DEFAULT 'not_set',
    age INTEGER,
    role VARCHAR(10) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Table: user_languages
CREATE TABLE user_languages (
    user_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    proficiency_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, language_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    FOREIGN KEY (proficiency_id) REFERENCES language_proficiency(id) ON DELETE RESTRICT
);

-- Table: user_interests
CREATE TABLE user_interests (
    user_id INTEGER NOT NULL,
    interest_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, interest_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (interest_id) REFERENCES interests(id) ON DELETE CASCADE
);

-- Table: user_goals
CREATE TABLE user_goals (
    user_id INTEGER NOT NULL,
    goal_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, goal_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Table: student_profiles
CREATE TABLE student_profiles (
    user_id INTEGER PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_game_date DATE,
    total_lessons_taken INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: tutor_profiles
CREATE TABLE tutor_profiles (
    user_id INTEGER PRIMARY KEY,
    bio TEXT,
    education JSONB,
    intro_video_url VARCHAR(255),
    approved BOOLEAN DEFAULT FALSE,
    years_experience INTEGER,
    rating DECIMAL(3,2),
    total_lessons_given INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: tutor_availability
CREATE TABLE tutor_availability (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table: lessons
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    tutor_id INTEGER NOT NULL,
    language_id INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    cancelled_by INTEGER,
    cancelled_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (tutor_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE RESTRICT,
    FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Table: reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_profiles_updated_at
    BEFORE UPDATE ON tutor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_availability_updated_at
    BEFORE UPDATE ON tutor_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Initial data for proficiency, languages, interests, goals
INSERT INTO language_proficiency (name) VALUES
('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2');

INSERT INTO languages (name) VALUES 
('English'), ('Spanish'), ('French'), ('German'), ('Italian'),
('Japanese'), ('Chinese'), ('Korean'), ('Russian'), ('Portuguese'),
('Arabic'), ('Hindi'), ('Turkish'), ('Dutch'), ('Swedish');

INSERT INTO interests (name) VALUES 
('Music'), ('Movies'), ('Sports'), ('Cooking'), ('Travel'),
('Photography'), ('Reading'), ('Writing'), ('Art'), ('Technology'),
('Science'), ('History'), ('Politics'), ('Fashion'), ('Gaming'),
('Fitness'), ('Nature'), ('Philosophy');

INSERT INTO goals (name) VALUES 
('Travel Preparation'), ('Business Communication'),
('Academic Study'), ('Certification Test Prep'), ('Cultural Understanding'),
('Reading Literature'), ('Writing Skills'), ('Listening Comprehension'),
('Pronunciation Improvement'), ('Grammar Mastery'), ('Vocabulary Building'),
('Fluency Development'), ('Accent Reduction'), ('Technical Language Skills');

-- Create indexes for improved performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_languages_user_id ON user_languages(user_id);
CREATE INDEX idx_user_languages_language_id ON user_languages(language_id);
CREATE INDEX idx_user_interests_user_id ON user_interests(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_tutor_availability_tutor_id ON tutor_availability(tutor_id);
CREATE INDEX idx_lessons_student_id ON lessons(student_id);
CREATE INDEX idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX idx_lessons_language_id ON lessons(language_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_reviews_lesson_id ON reviews(lesson_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id); 