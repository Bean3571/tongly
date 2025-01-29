CREATE TABLE IF NOT EXISTS tutors (
    id SERIAL PRIMARY KEY,
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

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON tutors
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp(); 