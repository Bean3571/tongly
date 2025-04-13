-- Drop indexes
DROP INDEX IF EXISTS idx_game_results_user_id;
DROP INDEX IF EXISTS idx_game_results_completed_at;

-- Drop tables
DROP TABLE IF EXISTS game_results;
DROP TABLE IF EXISTS emojis; 