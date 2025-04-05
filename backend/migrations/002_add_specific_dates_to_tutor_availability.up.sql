-- Add specific_date to tutor_availability table for non-recurring availability
ALTER TABLE tutor_availability 
ADD COLUMN specific_date DATE DEFAULT NULL;

-- Create index for faster lookups by date
CREATE INDEX idx_tutor_availability_specific_date ON tutor_availability(specific_date);

-- Create index for faster queries by tutor_id and date
CREATE INDEX idx_tutor_availability_tutor_date ON tutor_availability(tutor_id, specific_date); 