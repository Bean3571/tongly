-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES user_credentials(id),
    tutor_id INTEGER NOT NULL REFERENCES user_credentials(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL,
    language VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tutor_timeslot UNIQUE (tutor_id, start_time, end_time)
);

-- Create video_sessions table
CREATE TABLE IF NOT EXISTS video_sessions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    room_id VARCHAR(100) NOT NULL,
    session_token VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_lesson_session UNIQUE (lesson_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    sender_id INTEGER NOT NULL REFERENCES user_credentials(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create lesson_ratings table
CREATE TABLE IF NOT EXISTS lesson_ratings (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_lesson_rating UNIQUE (lesson_id)
);

-- Create indexes
CREATE INDEX idx_lessons_student_id ON lessons(student_id);
CREATE INDEX idx_lessons_tutor_id ON lessons(tutor_id);
CREATE INDEX idx_lessons_start_time ON lessons(start_time);
CREATE INDEX idx_lessons_status ON lessons(status);
CREATE INDEX idx_chat_messages_lesson_id ON chat_messages(lesson_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_lesson_ratings_lesson_id ON lesson_ratings(lesson_id); 