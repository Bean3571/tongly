-- Add video call related fields to the lessons table
ALTER TABLE lessons ADD COLUMN session_id VARCHAR(255);
ALTER TABLE lessons ADD COLUMN join_token_student VARCHAR(255);
ALTER TABLE lessons ADD COLUMN join_token_tutor VARCHAR(255);

-- Create a new table for video call events for analytics (optional)
CREATE TABLE video_call_events (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_video_call_events_lesson_id ON video_call_events(lesson_id);
CREATE INDEX idx_video_call_events_user_id ON video_call_events(user_id);
CREATE INDEX idx_lessons_session_id ON lessons(session_id); 