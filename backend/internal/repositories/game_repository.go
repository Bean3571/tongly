package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/entities"
)

// GameRepository handles database operations for games
type GameRepository struct {
	db *sql.DB
}

// NewGameRepository creates a new GameRepository
func NewGameRepository(db *sql.DB) *GameRepository {
	return &GameRepository{
		db: db,
	}
}

// GetRandomEmojis retrieves a random set of emojis from the database
func (r *GameRepository) GetRandomEmojis(ctx context.Context, count int) ([]entities.Emoji, error) {
	query := `
		SELECT id, emoji, name_en, name_es, name_ru, created_at
		FROM emojis
		ORDER BY RANDOM()
		LIMIT $1
	`

	rows, err := r.db.QueryContext(ctx, query, count)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var emojis []entities.Emoji
	for rows.Next() {
		var emoji entities.Emoji
		if err := rows.Scan(
			&emoji.ID,
			&emoji.Emoji,
			&emoji.NameEN,
			&emoji.NameES,
			&emoji.NameRU,
			&emoji.CreatedAt,
		); err != nil {
			return nil, err
		}
		emojis = append(emojis, emoji)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return emojis, nil
}

// SaveGameResult saves a game result to the database
func (r *GameRepository) SaveGameResult(ctx context.Context, result *entities.GameResult) error {
	query := `
		INSERT INTO game_results (user_id, game_type, language_id, score, completed_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, completed_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		result.UserID,
		result.GameType,
		result.LanguageID,
		result.Score,
	).Scan(&result.ID, &result.CompletedAt)

	return err
}

// UpdateStudentStreak updates a student's streak
func (r *GameRepository) UpdateStudentStreak(ctx context.Context, userID int) error {
	// First, check if the student has played a game today
	queryHasPlayedToday := `
		SELECT COUNT(*) 
		FROM game_results 
		WHERE user_id = $1 
		AND completed_at >= CURRENT_DATE 
		AND completed_at < CURRENT_DATE + INTERVAL '1 day'
	`

	var count int
	err := r.db.QueryRowContext(ctx, queryHasPlayedToday, userID).Scan(&count)
	if err != nil {
		return err
	}

	// If they haven't played today, we don't need to update
	if count <= 0 {
		return nil
	}

	// Check if they played yesterday to see if we need to increment the streak
	queryPlayedYesterday := `
		SELECT COUNT(*) 
		FROM game_results 
		WHERE user_id = $1 
		AND completed_at >= CURRENT_DATE - INTERVAL '1 day' 
		AND completed_at < CURRENT_DATE
	`

	err = r.db.QueryRowContext(ctx, queryPlayedYesterday, userID).Scan(&count)
	if err != nil {
		return err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if count > 0 {
		// They played yesterday, increment streak
		query := `
			UPDATE student_profiles
			SET current_streak = current_streak + 1,
				longest_streak = CASE 
					WHEN current_streak + 1 > longest_streak THEN current_streak + 1 
					ELSE longest_streak 
				END
			WHERE user_id = $1
		`
		_, err = tx.ExecContext(ctx, query, userID)
	} else {
		// They didn't play yesterday, reset streak to 1
		query := `
			UPDATE student_profiles
			SET current_streak = 1
			WHERE user_id = $1
		`
		_, err = tx.ExecContext(ctx, query, userID)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetLeaderboard retrieves the top players by total score
func (r *GameRepository) GetLeaderboard(ctx context.Context, limit int) ([]entities.LeaderboardEntry, error) {
	query := `
		SELECT 
			u.id, 
			u.username, 
			u.first_name, 
			u.last_name, 
			COALESCE(SUM(gr.score), 0) as total_score,
			sp.current_streak,
			sp.longest_streak,
			RANK() OVER (ORDER BY SUM(gr.score) DESC) as rank
		FROM 
			users u
		JOIN 
			student_profiles sp ON u.id = sp.user_id
		LEFT JOIN 
			game_results gr ON u.id = gr.user_id
		WHERE 
			u.role = 'student'
		GROUP BY 
			u.id, u.username, u.first_name, u.last_name, sp.current_streak, sp.longest_streak
		ORDER BY 
			total_score DESC
		LIMIT $1
	`

	rows, err := r.db.QueryContext(ctx, query, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []entities.LeaderboardEntry
	for rows.Next() {
		var entry entities.LeaderboardEntry
		if err := rows.Scan(
			&entry.UserID,
			&entry.Username,
			&entry.FirstName,
			&entry.LastName,
			&entry.TotalScore,
			&entry.CurrentStreak,
			&entry.LongestStreak,
			&entry.Rank,
		); err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return entries, nil
}

// GetUserRank retrieves a user's rank and score
func (r *GameRepository) GetUserRank(ctx context.Context, userID int) (*entities.LeaderboardEntry, error) {
	query := `
		WITH user_ranks AS (
			SELECT 
				u.id, 
				u.username, 
				u.first_name, 
				u.last_name, 
				COALESCE(SUM(gr.score), 0) as total_score,
				sp.current_streak,
				sp.longest_streak,
				RANK() OVER (ORDER BY SUM(gr.score) DESC) as rank
			FROM 
				users u
			JOIN 
				student_profiles sp ON u.id = sp.user_id
			LEFT JOIN 
				game_results gr ON u.id = gr.user_id
			WHERE 
				u.role = 'student'
			GROUP BY 
				u.id, u.username, u.first_name, u.last_name, sp.current_streak, sp.longest_streak
		)
		SELECT * FROM user_ranks WHERE id = $1
	`

	var entry entities.LeaderboardEntry
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&entry.UserID,
		&entry.Username,
		&entry.FirstName,
		&entry.LastName,
		&entry.TotalScore,
		&entry.CurrentStreak,
		&entry.LongestStreak,
		&entry.Rank,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &entry, nil
}
