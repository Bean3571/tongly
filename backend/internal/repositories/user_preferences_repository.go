package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/entities"
)

// UserPreferencesRepository handles database operations for user preferences
type UserPreferencesRepository struct {
	db *sql.DB
}

// NewUserPreferencesRepository creates a new UserPreferencesRepository
func NewUserPreferencesRepository(db *sql.DB) *UserPreferencesRepository {
	return &UserPreferencesRepository{
		db: db,
	}
}

// GetUserLanguages retrieves all languages for a user
func (r *UserPreferencesRepository) GetUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	query := `
		SELECT ul.user_id, ul.language_id, ul.proficiency_id, ul.created_at,
			l.name as language_name, lp.name as proficiency_name
		FROM user_languages ul
		JOIN languages l ON ul.language_id = l.id
		JOIN language_proficiency lp ON ul.proficiency_id = lp.id
		WHERE ul.user_id = $1
		ORDER BY l.name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var languages []entities.UserLanguage
	for rows.Next() {
		var ul entities.UserLanguage
		var languageName, proficiencyName string

		err := rows.Scan(
			&ul.UserID,
			&ul.LanguageID,
			&ul.ProficiencyID,
			&ul.CreatedAt,
			&languageName,
			&proficiencyName,
		)
		if err != nil {
			return nil, err
		}

		ul.Language = &entities.Language{
			ID:   ul.LanguageID,
			Name: languageName,
		}

		ul.Proficiency = &entities.LanguageProficiency{
			ID:   ul.ProficiencyID,
			Name: proficiencyName,
		}

		languages = append(languages, ul)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return languages, nil
}

// AddUserLanguage adds a language to a user's profile
func (r *UserPreferencesRepository) AddUserLanguage(ctx context.Context, userID, languageID, proficiencyID int) error {
	query := `
		INSERT INTO user_languages (user_id, language_id, proficiency_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, language_id)
		DO UPDATE SET proficiency_id = $3
	`

	_, err := r.db.ExecContext(ctx, query, userID, languageID, proficiencyID)
	return err
}

// UpdateUserLanguage updates a language proficiency for a user
func (r *UserPreferencesRepository) UpdateUserLanguage(ctx context.Context, userID, languageID, proficiencyID int) error {
	query := `
		UPDATE user_languages
		SET proficiency_id = $3
		WHERE user_id = $1 AND language_id = $2
	`

	result, err := r.db.ExecContext(ctx, query, userID, languageID, proficiencyID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		// If no rows were affected, the language might not exist for this user
		// We can choose to add it
		return r.AddUserLanguage(ctx, userID, languageID, proficiencyID)
	}

	return nil
}

// RemoveUserLanguage removes a language from a user's profile
func (r *UserPreferencesRepository) RemoveUserLanguage(ctx context.Context, userID, languageID int) error {
	query := `
		DELETE FROM user_languages
		WHERE user_id = $1 AND language_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, userID, languageID)
	return err
}

// GetUserInterests retrieves all interests for a user
func (r *UserPreferencesRepository) GetUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	query := `
		SELECT ui.user_id, ui.interest_id, ui.created_at,
			i.name as interest_name
		FROM user_interests ui
		JOIN interests i ON ui.interest_id = i.id
		WHERE ui.user_id = $1
		ORDER BY i.name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interests []entities.UserInterest
	for rows.Next() {
		var ui entities.UserInterest
		var interestName string

		err := rows.Scan(
			&ui.UserID,
			&ui.InterestID,
			&ui.CreatedAt,
			&interestName,
		)
		if err != nil {
			return nil, err
		}

		ui.Interest = &entities.Interest{
			ID:   ui.InterestID,
			Name: interestName,
		}

		interests = append(interests, ui)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return interests, nil
}

// AddUserInterest adds an interest to a user's profile
func (r *UserPreferencesRepository) AddUserInterest(ctx context.Context, userID, interestID int) error {
	query := `
		INSERT INTO user_interests (user_id, interest_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, interest_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, userID, interestID)
	return err
}

// RemoveUserInterest removes an interest from a user's profile
func (r *UserPreferencesRepository) RemoveUserInterest(ctx context.Context, userID, interestID int) error {
	query := `
		DELETE FROM user_interests
		WHERE user_id = $1 AND interest_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, userID, interestID)
	return err
}

// GetUserGoals retrieves all goals for a user
func (r *UserPreferencesRepository) GetUserGoals(ctx context.Context, userID int) ([]entities.UserGoal, error) {
	query := `
		SELECT ug.user_id, ug.goal_id, ug.created_at,
			g.name as goal_name
		FROM user_goals ug
		JOIN goals g ON ug.goal_id = g.id
		WHERE ug.user_id = $1
		ORDER BY g.name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []entities.UserGoal
	for rows.Next() {
		var ug entities.UserGoal
		var goalName string

		err := rows.Scan(
			&ug.UserID,
			&ug.GoalID,
			&ug.CreatedAt,
			&goalName,
		)
		if err != nil {
			return nil, err
		}

		ug.Goal = &entities.Goal{
			ID:   ug.GoalID,
			Name: goalName,
		}

		goals = append(goals, ug)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return goals, nil
}

// AddUserGoal adds a goal to a user's profile
func (r *UserPreferencesRepository) AddUserGoal(ctx context.Context, userID, goalID int) error {
	query := `
		INSERT INTO user_goals (user_id, goal_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, goal_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, userID, goalID)
	return err
}

// RemoveUserGoal removes a goal from a user's profile
func (r *UserPreferencesRepository) RemoveUserGoal(ctx context.Context, userID, goalID int) error {
	query := `
		DELETE FROM user_goals
		WHERE user_id = $1 AND goal_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, userID, goalID)
	return err
}
