-- Drop the existing status index
DROP INDEX IF EXISTS idx_lessons_status;

-- Add cancelled field and fill it with data based on current status
ALTER TABLE lessons ADD COLUMN cancelled BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE lessons SET cancelled = TRUE WHERE status = 'cancelled';

-- Drop the status column
ALTER TABLE lessons DROP COLUMN status;

-- Create index on the new field
CREATE INDEX idx_lessons_cancelled ON lessons(cancelled);

-- Add trigger for lessons table (it was missing in the original schema)
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 