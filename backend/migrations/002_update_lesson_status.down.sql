-- Drop the trigger
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

-- Drop the cancelled index
DROP INDEX IF EXISTS idx_lessons_cancelled;

-- Add back the status column
ALTER TABLE lessons ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'scheduled';

-- Populate status based on cancelled flag and time
UPDATE lessons SET status = 'cancelled' WHERE cancelled = TRUE;
UPDATE lessons SET status = 'in_progress' 
    WHERE cancelled = FALSE 
    AND start_time <= NOW() 
    AND end_time >= NOW();
UPDATE lessons SET status = 'completed' 
    WHERE cancelled = FALSE 
    AND end_time < NOW();
UPDATE lessons SET status = 'scheduled' 
    WHERE cancelled = FALSE 
    AND start_time > NOW();

-- Add constraint on status
ALTER TABLE lessons ADD CONSTRAINT check_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'));

-- Drop the cancelled column
ALTER TABLE lessons DROP COLUMN cancelled;

-- Recreate the status index
CREATE INDEX idx_lessons_status ON lessons(status); 