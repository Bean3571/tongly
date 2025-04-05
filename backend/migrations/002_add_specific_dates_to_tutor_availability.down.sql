-- Remove indexes
DROP INDEX IF EXISTS idx_tutor_availability_specific_date;
DROP INDEX IF EXISTS idx_tutor_availability_tutor_date;

-- Remove the specific_date column
ALTER TABLE tutor_availability
DROP COLUMN IF EXISTS specific_date; 