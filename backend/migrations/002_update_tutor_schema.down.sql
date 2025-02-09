-- Add native_languages column back
ALTER TABLE tutor_details ADD COLUMN native_languages TEXT[] CHECK (array_length(native_languages, 1) <= 3);

-- Update native_languages from teaching_languages where level is 'Native'
UPDATE tutor_details
SET native_languages = ARRAY(
    SELECT DISTINCT (elem->>'language')::TEXT
    FROM jsonb_array_elements(teaching_languages) AS elem
    WHERE elem->>'level' = 'Native'
);

-- Remove native language entries from teaching_languages
UPDATE tutor_details
SET teaching_languages = (
    SELECT jsonb_agg(elem)
    FROM jsonb_array_elements(teaching_languages) AS elem
    WHERE elem->>'level' != 'Native'
);

-- Rename education back to degrees
ALTER TABLE tutor_details RENAME COLUMN education TO degrees; 