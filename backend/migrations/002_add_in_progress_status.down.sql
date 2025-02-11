-- Drop the new check constraint
ALTER TABLE lessons DROP CONSTRAINT lessons_status_check;

-- Add back the original check constraint
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
    CHECK (status IN ('scheduled', 'completed', 'cancelled')); 