-- Drop the existing check constraint
ALTER TABLE lessons DROP CONSTRAINT lessons_status_check;

-- Add the new check constraint with 'in_progress' status
ALTER TABLE lessons ADD CONSTRAINT lessons_status_check 
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')); 