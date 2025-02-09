-- Drop native_languages column from tutor_details
ALTER TABLE tutor_details DROP COLUMN native_languages;

-- Rename degrees to education
ALTER TABLE tutor_details RENAME COLUMN degrees TO education; 