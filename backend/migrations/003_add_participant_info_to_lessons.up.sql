-- Add views for participant information
CREATE OR REPLACE VIEW lesson_participants AS
WITH user_info AS (
    SELECT 
        uc.id,
        uc.username,
        up.first_name,
        up.last_name,
        up.profile_picture as avatar_url
    FROM user_credentials uc
    LEFT JOIN user_personal up ON up.user_id = uc.id
)
SELECT 
    l.id as lesson_id,
    -- Student info
    s.username as student_username,
    s.first_name as student_first_name,
    s.last_name as student_last_name,
    s.avatar_url as student_avatar_url,
    -- Tutor info
    t.username as tutor_username,
    t.first_name as tutor_first_name,
    t.last_name as tutor_last_name,
    t.avatar_url as tutor_avatar_url
FROM lessons l
JOIN user_info s ON s.id = l.student_id
JOIN user_info t ON t.id = l.tutor_id; 