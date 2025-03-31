package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"tongly-backend/internal/entities"

	"github.com/lib/pq"
)

type StudentRepositoryImpl struct {
	db *sql.DB
}

func NewStudentRepository(db *sql.DB) StudentRepository {
	return &StudentRepositoryImpl{db: db}
}

// CreateStudentProfile creates a student profile
func (r *StudentRepositoryImpl) CreateStudentProfile(ctx context.Context, profile *entities.StudentProfile) error {
	query := `
		INSERT INTO student_profiles (
			user_id, current_streak, longest_streak, last_game_date, 
			total_lessons_taken, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at, updated_at`

	now := time.Now()
	err := r.db.QueryRowContext(
		ctx,
		query,
		profile.UserID,
		profile.CurrentStreak,
		profile.LongestStreak,
		profile.LastGameDate,
		profile.TotalLessonsTaken,
		now, now,
	).Scan(&profile.CreatedAt, &profile.UpdatedAt)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return errors.New("student profile already exists for this user")
		}
		return fmt.Errorf("error creating student profile: %v", err)
	}

	return nil
}

// GetStudentByID retrieves a student by ID with full user info
func (r *StudentRepositoryImpl) GetStudentByID(ctx context.Context, studentID int) (*entities.StudentProfile, error) {
	query := `
		SELECT 
			sp.user_id, sp.current_streak, sp.longest_streak, sp.last_game_date, 
			sp.total_lessons_taken, sp.created_at, sp.updated_at,
			u.username, u.email, u.first_name, u.last_name, u.profile_picture_url,
			u.role, u.created_at, u.updated_at
		FROM student_profiles sp
		JOIN users u ON sp.user_id = u.id
		WHERE sp.user_id = $1`

	var profile entities.StudentProfile
	var user entities.User
	var profilePicURL sql.NullString
	var lastGameDate sql.NullTime

	err := r.db.QueryRowContext(ctx, query, studentID).Scan(
		&profile.UserID,
		&profile.CurrentStreak,
		&profile.LongestStreak,
		&lastGameDate,
		&profile.TotalLessonsTaken,
		&profile.CreatedAt,
		&profile.UpdatedAt,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&profilePicURL,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("student not found")
		}
		return nil, fmt.Errorf("error retrieving student: %v", err)
	}

	// Set optional fields
	if lastGameDate.Valid {
		dateStr := lastGameDate.Time.Format(time.RFC3339)
		profile.LastGameDate = &dateStr
	}

	if profilePicURL.Valid {
		user.ProfilePictureURL = &profilePicURL.String
	}

	user.ID = profile.UserID
	profile.User = &user

	// Get languages
	langs, err := r.getUserLanguages(ctx, profile.UserID)
	if err == nil {
		profile.Languages = langs
	}

	// Get interests
	interests, err := r.getUserInterests(ctx, profile.UserID)
	if err == nil {
		profile.Interests = interests
	}

	// Get goals
	goals, err := r.getUserGoals(ctx, profile.UserID)
	if err == nil {
		profile.Goals = goals
	}

	return &profile, nil
}

// GetStudentProfileByUserID retrieves a student profile by user ID
func (r *StudentRepositoryImpl) GetStudentProfileByUserID(ctx context.Context, userID int) (*entities.StudentProfile, error) {
	return r.GetStudentByID(ctx, userID)
}

// UpdateStudentProfile updates a student profile
func (r *StudentRepositoryImpl) UpdateStudentProfile(ctx context.Context, profile *entities.StudentProfile) error {
	query := `
		UPDATE student_profiles
		SET 
			current_streak = $1,
			longest_streak = $2,
			last_game_date = $3,
			total_lessons_taken = $4,
			updated_at = $5
		WHERE user_id = $6
		RETURNING updated_at`

	now := time.Now()
	err := r.db.QueryRowContext(
		ctx,
		query,
		profile.CurrentStreak,
		profile.LongestStreak,
		profile.LastGameDate,
		profile.TotalLessonsTaken,
		now,
		profile.UserID,
	).Scan(&profile.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("student profile not found")
		}
		return fmt.Errorf("error updating student profile: %v", err)
	}

	return nil
}

// UpdateStudentStreak updates a student's streak information
func (r *StudentRepositoryImpl) UpdateStudentStreak(ctx context.Context, userID int, currentStreak int, longestStreak int, lastGameDate string) error {
	query := `
		UPDATE student_profiles
		SET 
			current_streak = $1,
			longest_streak = $2,
			last_game_date = $3,
			updated_at = $4
		WHERE user_id = $5`

	var parsedDate *time.Time
	if lastGameDate != "" {
		t, err := time.Parse(time.RFC3339, lastGameDate)
		if err != nil {
			return fmt.Errorf("invalid date format: %v", err)
		}
		parsedDate = &t
	}

	now := time.Now()
	result, err := r.db.ExecContext(
		ctx,
		query,
		currentStreak,
		longestStreak,
		parsedDate,
		now,
		userID,
	)

	if err != nil {
		return fmt.Errorf("error updating student streak: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}

	if rows == 0 {
		return errors.New("student profile not found")
	}

	return nil
}

// IncrementLessonsTaken increments the total lessons taken by a student
func (r *StudentRepositoryImpl) IncrementLessonsTaken(ctx context.Context, userID int) error {
	query := `
		UPDATE student_profiles
		SET 
			total_lessons_taken = total_lessons_taken + 1,
			updated_at = $1
		WHERE user_id = $2`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, now, userID)
	if err != nil {
		return fmt.Errorf("error incrementing lessons taken: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}

	if rows == 0 {
		return errors.New("student profile not found")
	}

	return nil
}

// Helper functions for related data
func (r *StudentRepositoryImpl) getUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	query := `
		SELECT ul.user_id, ul.language_id, ul.proficiency_id, ul.created_at,
		       l.name as language_name, p.name as proficiency_name
		FROM user_languages ul
		JOIN languages l ON ul.language_id = l.id
		JOIN language_proficiency p ON ul.proficiency_id = p.id
		WHERE ul.user_id = $1
		ORDER BY ul.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving student languages: %v", err)
	}
	defer rows.Close()

	var languages []entities.UserLanguage
	for rows.Next() {
		var ul entities.UserLanguage
		var language entities.Language
		var proficiency entities.Proficiency

		err := rows.Scan(
			&ul.UserID,
			&ul.LanguageID,
			&ul.ProficiencyID,
			&ul.CreatedAt,
			&language.Name,
			&proficiency.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning student language row: %v", err)
		}

		language.ID = ul.LanguageID
		proficiency.ID = ul.ProficiencyID
		ul.Language = &language
		ul.Proficiency = &proficiency

		languages = append(languages, ul)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating student language rows: %v", err)
	}

	return languages, nil
}

func (r *StudentRepositoryImpl) getUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	query := `
		SELECT ui.user_id, ui.interest_id, ui.created_at, i.name
		FROM user_interests ui
		JOIN interests i ON ui.interest_id = i.id
		WHERE ui.user_id = $1
		ORDER BY ui.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving student interests: %v", err)
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
			&interest.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning student interest row: %v", err)
		}

		interest.ID = ui.InterestID
		ui.Interest = &interest

		interests = append(interests, ui)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating student interest rows: %v", err)
	}

	return interests, nil
}

func (r *StudentRepositoryImpl) getUserGoals(ctx context.Context, userID int) ([]entities.UserGoal, error) {
	query := `
		SELECT ug.user_id, ug.goal_id, ug.created_at, g.name
		FROM user_goals ug
		JOIN goals g ON ug.goal_id = g.id
		WHERE ug.user_id = $1
		ORDER BY ug.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving student goals: %v", err)
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
			&goal.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning student goal row: %v", err)
		}

		goal.ID = ug.GoalID
		ug.Goal = &goal

		goals = append(goals, ug)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating student goal rows: %v", err)
	}

	return goals, nil
}
