package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"tongly-backend/internal/entities"
)

// TutorRepository handles database operations for tutor profiles
type TutorRepository struct {
	db *sql.DB
}

// NewTutorRepository creates a new TutorRepository
func NewTutorRepository(db *sql.DB) *TutorRepository {
	return &TutorRepository{
		db: db,
	}
}

// Create inserts a new tutor profile into the database
func (r *TutorRepository) Create(ctx context.Context, tutorProfile *entities.TutorProfile) error {
	// Convert education to JSONB
	educationJSON, err := json.Marshal(tutorProfile.Education)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO tutor_profiles
		(user_id, bio, education, intro_video_url, approved, years_experience)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`

	err = r.db.QueryRowContext(
		ctx,
		query,
		tutorProfile.UserID,
		tutorProfile.Bio,
		educationJSON,
		tutorProfile.IntroVideoURL,
		tutorProfile.Approved,
		tutorProfile.YearsExperience,
	).Scan(&tutorProfile.CreatedAt, &tutorProfile.UpdatedAt)

	return err
}

// GetByUserID retrieves a tutor profile by user ID
func (r *TutorRepository) GetByUserID(ctx context.Context, userID int) (*entities.TutorProfile, error) {
	query := `
		SELECT user_id, bio, education, intro_video_url, approved, years_experience, created_at, updated_at
		FROM tutor_profiles
		WHERE user_id = $1
	`

	var educationJSON []byte
	profile := &entities.TutorProfile{}
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.Bio,
		&educationJSON,
		&profile.IntroVideoURL,
		&profile.Approved,
		&profile.YearsExperience,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	// Parse education JSON
	if educationJSON != nil {
		var education interface{}
		if err := json.Unmarshal(educationJSON, &education); err != nil {
			return nil, err
		}
		profile.Education = education
	}

	return profile, nil
}

// Update updates a tutor profile
func (r *TutorRepository) Update(ctx context.Context, tutorProfile *entities.TutorProfile) error {
	// Convert education to JSONB
	educationJSON, err := json.Marshal(tutorProfile.Education)
	if err != nil {
		return err
	}

	query := `
		UPDATE tutor_profiles
		SET bio = $1, education = $2, intro_video_url = $3, years_experience = $4
		WHERE user_id = $5
		RETURNING updated_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		tutorProfile.Bio,
		educationJSON,
		tutorProfile.IntroVideoURL,
		tutorProfile.YearsExperience,
		tutorProfile.UserID,
	).Scan(&tutorProfile.UpdatedAt)
}

// UpdateApprovalStatus updates a tutor's approval status
func (r *TutorRepository) UpdateApprovalStatus(ctx context.Context, userID int, approved bool) error {
	query := `
		UPDATE tutor_profiles
		SET approved = $1
		WHERE user_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, approved, userID)
	return err
}

// Delete deletes a tutor profile
func (r *TutorRepository) Delete(ctx context.Context, userID int) error {
	query := `DELETE FROM tutor_profiles WHERE user_id = $1`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

// GetAvailabilities retrieves all availabilities for a tutor
func (r *TutorRepository) GetAvailabilities(ctx context.Context, tutorID int) ([]entities.TutorAvailability, error) {
	query := `
		SELECT id, tutor_id, day_of_week, start_time, end_time, is_recurring, created_at, updated_at
		FROM tutor_availability
		WHERE tutor_id = $1
	`

	rows, err := r.db.QueryContext(ctx, query, tutorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var availabilities []entities.TutorAvailability
	for rows.Next() {
		var availability entities.TutorAvailability
		var startTime, endTime string

		err := rows.Scan(
			&availability.ID,
			&availability.TutorID,
			&availability.DayOfWeek,
			&startTime,
			&endTime,
			&availability.IsRecurring,
			&availability.CreatedAt,
			&availability.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		availability.StartTime = startTime
		availability.EndTime = endTime
		availabilities = append(availabilities, availability)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return availabilities, nil
}

// AddAvailability adds an availability for a tutor
func (r *TutorRepository) AddAvailability(ctx context.Context, availability *entities.TutorAvailability) error {
	query := `
		INSERT INTO tutor_availability 
		(tutor_id, day_of_week, start_time, end_time, is_recurring)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		availability.TutorID,
		availability.DayOfWeek,
		availability.StartTime,
		availability.EndTime,
		availability.IsRecurring,
	).Scan(&availability.ID, &availability.CreatedAt, &availability.UpdatedAt)
}

// UpdateAvailability updates an availability for a tutor
func (r *TutorRepository) UpdateAvailability(ctx context.Context, availability *entities.TutorAvailability) error {
	query := `
		UPDATE tutor_availability
		SET day_of_week = $1, start_time = $2, end_time = $3, is_recurring = $4
		WHERE id = $5 AND tutor_id = $6
		RETURNING updated_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		availability.DayOfWeek,
		availability.StartTime,
		availability.EndTime,
		availability.IsRecurring,
		availability.ID,
		availability.TutorID,
	).Scan(&availability.UpdatedAt)
}

// DeleteAvailability deletes an availability for a tutor
func (r *TutorRepository) DeleteAvailability(ctx context.Context, availabilityID, tutorID int) error {
	query := `DELETE FROM tutor_availability WHERE id = $1 AND tutor_id = $2`
	_, err := r.db.ExecContext(ctx, query, availabilityID, tutorID)
	return err
}

// SearchTutors searches for tutors based on filters
func (r *TutorRepository) SearchTutors(ctx context.Context, filters *entities.TutorSearchFilters) ([]entities.TutorProfile, error) {
	// Base query to get all tutors
	baseQuery := `
		SELECT tp.user_id, tp.bio, tp.education, tp.intro_video_url, tp.approved, 
		       tp.years_experience, tp.created_at, tp.updated_at
		FROM tutor_profiles tp
		JOIN users u ON tp.user_id = u.id
		WHERE tp.approved = true
	`

	// Add language filter if needed
	var additionalQuery string
	var args []interface{}

	if filters != nil && len(filters.Languages) > 0 {
		additionalQuery = `
			AND tp.user_id IN (
				SELECT DISTINCT ul.user_id
				FROM user_languages ul
				JOIN languages l ON ul.language_id = l.id
				WHERE l.name = ANY($1)
			)
		`
		args = append(args, filters.Languages)
	}

	// Combine queries
	query := baseQuery + additionalQuery

	// If no arguments, query without args
	var rows *sql.Rows
	var err error
	if len(args) == 0 {
		rows, err = r.db.QueryContext(ctx, query)
	} else {
		rows, err = r.db.QueryContext(ctx, query, args...)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tutors []entities.TutorProfile
	for rows.Next() {
		var tutor entities.TutorProfile
		var educationJSON []byte

		err := rows.Scan(
			&tutor.UserID,
			&tutor.Bio,
			&educationJSON,
			&tutor.IntroVideoURL,
			&tutor.Approved,
			&tutor.YearsExperience,
			&tutor.CreatedAt,
			&tutor.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse education JSON
		if educationJSON != nil {
			var education interface{}
			if err := json.Unmarshal(educationJSON, &education); err != nil {
				return nil, err
			}
			tutor.Education = education
		}

		tutors = append(tutors, tutor)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return tutors, nil
}
