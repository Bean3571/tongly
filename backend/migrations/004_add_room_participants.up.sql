-- Create room_participants table
CREATE TABLE room_participants (
    id SERIAL PRIMARY KEY,
    lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES user_credentials(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(lesson_id, user_id)
);

-- Add indexes
CREATE INDEX idx_room_participants_lesson_id ON room_participants(lesson_id);
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX idx_room_participants_joined_at ON room_participants(joined_at); 