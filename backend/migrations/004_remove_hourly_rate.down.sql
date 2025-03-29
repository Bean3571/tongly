-- Add hourly_rate column back to tutor_details table
ALTER TABLE tutor_details ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);

-- Recreate the index
CREATE INDEX idx_tutor_details_hourly_rate ON tutor_details(hourly_rate); 