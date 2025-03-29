-- Drop the index first
DROP INDEX IF EXISTS idx_tutor_details_hourly_rate;

-- Remove hourly_rate column from tutor_details table
ALTER TABLE tutor_details DROP COLUMN IF EXISTS hourly_rate; 