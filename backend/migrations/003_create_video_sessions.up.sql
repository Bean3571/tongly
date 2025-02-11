CREATE TABLE video_sessions (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    room_id VARCHAR(255) NOT NULL,
    session_token TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_video_sessions_lesson_id ON video_sessions(lesson_id);
CREATE INDEX idx_video_sessions_room_id ON video_sessions(room_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_video_sessions_updated_at
    BEFORE UPDATE ON video_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 