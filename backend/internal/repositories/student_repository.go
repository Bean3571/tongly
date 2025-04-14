package repositories

import (
	"context"
	"database/sql"
	"errors"
	"tongly-backend/internal/entities"
)

// StudentRepository handles database operations for student profiles
type StudentRepository struct {
	db *sql.DB
}

// NewStudentRepository creates a new StudentRepository
func NewStudentRepository(db *sql.DB) *StudentRepository {
	return &StudentRepository{
		db: db,
	}
}

// Create inserts a new student profile into the database
func (r *StudentRepository) Create(ctx context.Context, studentProfile *entities.StudentProfile) error {
	query := `
		INSERT INTO student_profiles
		(user_id, current_streak, longest_streak)
		VALUES ($1, $2, $3)
		RETURNING created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		studentProfile.UserID,
		studentProfile.CurrentStreak,
		studentProfile.LongestStreak,
	).Scan(&studentProfile.CreatedAt, &studentProfile.UpdatedAt)

	return err
}

// GetByUserID retrieves a student profile by user ID
func (r *StudentRepository) GetByUserID(ctx context.Context, userID int) (*entities.StudentProfile, error) {
	query := `
		SELECT user_id, current_streak, longest_streak, created_at, updated_at
		FROM student_profiles
		WHERE user_id = $1
	`

	profile := &entities.StudentProfile{}
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.CurrentStreak,
		&profile.LongestStreak,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return profile, nil
}

// Update updates a student profile
func (r *StudentRepository) Update(ctx context.Context, studentProfile *entities.StudentProfile) error {
	query := `
		UPDATE student_profiles
		SET current_streak = $1, longest_streak = $2
		WHERE user_id = $3
		RETURNING updated_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		studentProfile.CurrentStreak,
		studentProfile.LongestStreak,
		studentProfile.UserID,
	).Scan(&studentProfile.UpdatedAt)
}

// Delete deletes a student profile
func (r *StudentRepository) Delete(ctx context.Context, userID int) error {
	query := `DELETE FROM student_profiles WHERE user_id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

// AddLanguage adds a language to a student's profile
func (r *StudentRepository) AddLanguage(ctx context.Context, userID, languageID, proficiencyID int) error {
	query := `
		INSERT INTO user_languages (user_id, language_id, proficiency_id)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, language_id) 
		DO UPDATE SET proficiency_id = $3
	`

	_, err := r.db.ExecContext(ctx, query, userID, languageID, proficiencyID)
	return err
}

// GetLanguages retrieves all languages for a student
func (r *StudentRepository) GetLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	query := `
		SELECT ul.user_id, ul.language_id, ul.proficiency_id, ul.created_at,
		       l.id, l.name, l.created_at,
		       lp.id, lp.name, lp.created_at
		FROM user_languages ul
		JOIN languages l ON ul.language_id = l.id
		JOIN language_proficiency lp ON ul.proficiency_id = lp.id
		WHERE ul.user_id = $1
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var languages []entities.UserLanguage
	for rows.Next() {
		var ul entities.UserLanguage
		var language entities.Language
		var proficiency entities.LanguageProficiency

		err := rows.Scan(
			&ul.UserID,
			&ul.LanguageID,
			&ul.ProficiencyID,
			&ul.CreatedAt,
			&language.ID,
			&language.Name,
			&language.CreatedAt,
			&proficiency.ID,
			&proficiency.Name,
			&proficiency.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		ul.Language = &language
		ul.Proficiency = &proficiency
		languages = append(languages, ul)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return languages, nil
}

// RemoveLanguage removes a language from a student's profile
func (r *StudentRepository) RemoveLanguage(ctx context.Context, userID, languageID int) error {
	query := `DELETE FROM user_languages WHERE user_id = $1 AND language_id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, languageID)
	return err
}

// AddInterest adds an interest to a student's profile
func (r *StudentRepository) AddInterest(ctx context.Context, userID, interestID int) error {
	query := `
		INSERT INTO user_interests (user_id, interest_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, interest_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, userID, interestID)
	return err
}

// GetInterests retrieves all interests for a student
func (r *StudentRepository) GetInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	query := `
		SELECT ui.user_id, ui.interest_id, ui.created_at,
		       i.id, i.name, i.created_at
		FROM user_interests ui
		JOIN interests i ON ui.interest_id = i.id
		WHERE ui.user_id = $1
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interests []entities.UserInterest
	for rows.Next() {
		var ui entities.UserInterest
		var interest entities.Interest

		err := rows.Scan(
			&ui.UserID,
			&ui.InterestID,
			&ui.CreatedAt,
			&interest.ID,
			&interest.Name,
			&interest.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		ui.Interest = &interest
		interests = append(interests, ui)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return interests, nil
}

// RemoveInterest removes an interest from a student's profile
func (r *StudentRepository) RemoveInterest(ctx context.Context, userID, interestID int) error {
	query := `DELETE FROM user_interests WHERE user_id = $1 AND interest_id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, interestID)
	return err
}

// AddGoal adds a goal to a student's profile
func (r *StudentRepository) AddGoal(ctx context.Context, userID, goalID int) error {
	query := `
		INSERT INTO user_goals (user_id, goal_id)
		VALUES ($1, $2)
		ON CONFLICT (user_id, goal_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, userID, goalID)
	return err
}

// GetGoals retrieves all goals for a student
func (r *StudentRepository) GetGoals(ctx context.Context, userID int) ([]entities.UserGoal, error) {
	query := `
		SELECT ug.user_id, ug.goal_id, ug.created_at,
		       g.id, g.name, g.created_at
		FROM user_goals ug
		JOIN goals g ON ug.goal_id = g.id
		WHERE ug.user_id = $1
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []entities.UserGoal
	for rows.Next() {
		var ug entities.UserGoal
		var goal entities.Goal

		err := rows.Scan(
			&ug.UserID,
			&ug.GoalID,
			&ug.CreatedAt,
			&goal.ID,
			&goal.Name,
			&goal.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		ug.Goal = &goal
		goals = append(goals, ug)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return goals, nil
}

// RemoveGoal removes a goal from a student's profile
func (r *StudentRepository) RemoveGoal(ctx context.Context, userID, goalID int) error {
	query := `DELETE FROM user_goals WHERE user_id = $1 AND goal_id = $2`
	_, err := r.db.ExecContext(ctx, query, userID, goalID)
	return err
}
