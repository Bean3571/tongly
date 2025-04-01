package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

	"github.com/lib/pq"
)

type TutorRepositoryImpl struct {
	DB *sql.DB
}

func NewTutorRepository(db *sql.DB) TutorRepository {
	return &TutorRepositoryImpl{
		DB: db,
	}
}

// CreateTutorProfile creates a tutor profile
func (r *TutorRepositoryImpl) CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		INSERT INTO tutor_profiles (
			user_id, bio, education, intro_video_url, approved,
			years_experience, rating, total_lessons_given,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		RETURNING user_id`

	educationJSON, err := json.Marshal(profile.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	now := time.Now()
	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.UserID,
		profile.Bio,
		educationJSON,
		profile.IntroductionVideo,
		profile.Approved,
		nil, // years_experience
		nil, // rating
		0,   // total_lessons_given
		now,
	).Scan(&profile.UserID)

	if err != nil {
		return fmt.Errorf("failed to create tutor profile: %v", err)
	}

	profile.CreatedAt = now
	profile.UpdatedAt = now

	return nil
}

// UpdateTutorProfile updates a tutor profile
func (r *TutorRepositoryImpl) UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		UPDATE tutor_profiles
		SET bio = $1,
			education = $2,
			intro_video_url = $3,
			approved = $4,
			years_experience = $5,
			rating = $6,
			total_lessons_given = $7,
			updated_at = $8
		WHERE user_id = $9
		RETURNING updated_at`

	educationJSON, err := json.Marshal(profile.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	now := time.Now()
	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.Bio,
		educationJSON,
		profile.IntroductionVideo,
		profile.Approved,
		nil, // years_experience
		nil, // rating
		0,   // total_lessons_given
		now,
		profile.UserID,
	).Scan(&profile.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update tutor profile: %v", err)
	}

	return nil
}

// GetTutorProfileByUserID retrieves a tutor profile by user ID
func (r *TutorRepositoryImpl) GetTutorProfileByUserID(ctx context.Context, userID int) (*entities.TutorProfile, error) {
	query := `
		SELECT user_id, bio, education, intro_video_url, approved,
			years_experience, rating, total_lessons_given,
			created_at, updated_at
		FROM tutor_profiles
		WHERE user_id = $1`

	profile := &entities.TutorProfile{}
	var educationJSON []byte

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&profile.UserID,
		&profile.Bio,
		&educationJSON,
		&profile.IntroductionVideo,
		&profile.Approved,
		nil, // years_experience
		nil, // rating
		nil, // total_lessons_given
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tutor profile by user ID: %v", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	return profile, nil
}

// GetTutorProfile retrieves a tutor profile by ID
func (r *TutorRepositoryImpl) GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	return r.GetTutorProfileByUserID(ctx, tutorID)
}

// GetTutorByID retrieves a tutor profile by ID - alias for GetTutorProfile
func (r *TutorRepositoryImpl) GetTutorByID(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	return r.GetTutorProfile(ctx, tutorID)
}

// ListTutors retrieves a list of tutors with pagination
func (r *TutorRepositoryImpl) ListTutors(ctx context.Context, limit, offset int) ([]entities.TutorProfile, error) {
	query := `
		SELECT 
			tp.user_id, tp.bio, tp.education, tp.intro_video_url, tp.approved,
			tp.years_experience, tp.rating, tp.total_lessons_given,
			tp.created_at, tp.updated_at,
			u.username, u.email, u.first_name, u.last_name, 
			u.profile_picture_url, u.role
		FROM tutor_profiles tp
		JOIN users u ON tp.user_id = u.id
		ORDER BY tp.created_at DESC
		LIMIT $1 OFFSET $2`

	rows, err := r.DB.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list tutors: %v", err)
	}
	defer rows.Close()

	var tutors []entities.TutorProfile
	for rows.Next() {
		var profile entities.TutorProfile
		var user entities.User
		var educationJSON []byte
		var profilePicURL sql.NullString

		err := rows.Scan(
			&profile.UserID,
			&profile.Bio,
			&educationJSON,
			&profile.IntroductionVideo,
			&profile.Approved,
			nil, // years_experience
			nil, // rating
			nil, // total_lessons_given
			&profile.CreatedAt,
			&profile.UpdatedAt,
			&user.Username,
			&user.Email,
			&user.FirstName,
			&user.LastName,
			&profilePicURL,
			&user.Role,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan tutor row: %v", err)
		}

		// Handle nullable fields
		if profilePicURL.Valid {
			user.ProfilePictureURL = &profilePicURL.String
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
			return nil, fmt.Errorf("failed to unmarshal education: %v", err)
		}

		user.ID = profile.UserID
		profile.User = &user

		tutors = append(tutors, profile)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tutor rows: %v", err)
	}

	return tutors, nil
}

// SearchTutors searches for tutors based on filters
func (r *TutorRepositoryImpl) SearchTutors(ctx context.Context, filters map[string]interface{}) ([]entities.TutorProfile, error) {
	query := `
		SELECT 
			tp.user_id, tp.bio, tp.education, tp.intro_video_url, tp.approved,
			tp.years_experience, tp.rating, tp.total_lessons_given,
			tp.created_at, tp.updated_at,
			u.username, u.email, u.first_name, u.last_name, 
			u.profile_picture_url, u.role
		FROM tutor_profiles tp
		JOIN users u ON tp.user_id = u.id
		WHERE tp.approved = true`

	args := []interface{}{}
	argPosition := 1

	// Add filters to query
	if languages, ok := filters["languages"].([]string); ok && len(languages) > 0 {
		query += fmt.Sprintf(` AND education ?| $%d`, argPosition)
		args = append(args, pq.Array(languages))
		argPosition++
	}

	// Add ordering
	query += ` ORDER BY tp.created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search tutors: %v", err)
	}
	defer rows.Close()

	var tutors []entities.TutorProfile
	for rows.Next() {
		var profile entities.TutorProfile
		var user entities.User
		var educationJSON []byte
		var profilePicURL sql.NullString

		err := rows.Scan(
			&profile.UserID,
			&profile.Bio,
			&educationJSON,
			&profile.IntroductionVideo,
			&profile.Approved,
			nil, // years_experience
			nil, // rating
			nil, // total_lessons_given
			&profile.CreatedAt,
			&profile.UpdatedAt,
			&user.Username,
			&user.Email,
			&user.FirstName,
			&user.LastName,
			&profilePicURL,
			&user.Role,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan tutor row: %v", err)
		}

		// Handle nullable fields
		if profilePicURL.Valid {
			user.ProfilePictureURL = &profilePicURL.String
		}

		// Unmarshal JSON fields
		if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
			return nil, fmt.Errorf("failed to unmarshal education: %v", err)
		}

		user.ID = profile.UserID
		profile.User = &user

		tutors = append(tutors, profile)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tutor rows: %v", err)
	}

	return tutors, nil
}

// UpdateTutorApprovalStatus updates a tutor's approval status
func (r *TutorRepositoryImpl) UpdateTutorApprovalStatus(ctx context.Context, userID int, approved bool) error {
	query := `
		UPDATE tutor_profiles
		SET approved = $1
		WHERE user_id = $2`

	result, err := r.DB.ExecContext(ctx, query, approved, userID)
	if err != nil {
		logger.Error("Failed to update tutor approval status",
			"error", err,
			"user_id", userID)
		return fmt.Errorf("failed to update tutor approval status: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rows == 0 {
		return fmt.Errorf("tutor profile not found for user ID: %d", userID)
	}

	return nil
}

// getUserByID is a helper method to get a user by ID
func (r *TutorRepositoryImpl) getUserByID(ctx context.Context, userID int) (*entities.User, error) {
	query := `
		SELECT id, username, email, first_name, last_name, 
			   profile_picture_url, sex, age, role, created_at, updated_at
		FROM users
		WHERE id = $1`

	var user entities.User
	var profilePicURL, sex sql.NullString
	var age sql.NullInt32

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&profilePicURL,
		&sex,
		&age,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("error retrieving user: %v", err)
	}

	// Handle nullable fields
	if profilePicURL.Valid {
		user.ProfilePictureURL = &profilePicURL.String
	}

	if sex.Valid {
		user.Sex = &sex.String
	}

	if age.Valid {
		ageVal := int(age.Int32)
		user.Age = &ageVal
	}

	return &user, nil
}

// getUserLanguages gets the languages for a tutor
func (r *TutorRepositoryImpl) getUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	query := `
		SELECT ul.user_id, ul.language_id, ul.proficiency_id, ul.created_at,
		       l.name as language_name, p.name as proficiency_name
		FROM user_languages ul
		JOIN languages l ON ul.language_id = l.id
		JOIN language_proficiency p ON ul.proficiency_id = p.id
		WHERE ul.user_id = $1
		ORDER BY ul.created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving tutor languages: %v", err)
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
			return nil, fmt.Errorf("error scanning tutor language row: %v", err)
		}

		language.ID = ul.LanguageID
		proficiency.ID = ul.ProficiencyID
		ul.Language = &language
		ul.Proficiency = &proficiency

		languages = append(languages, ul)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tutor language rows: %v", err)
	}

	return languages, nil
}

// getUserInterests gets the interests for a tutor
func (r *TutorRepositoryImpl) getUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	query := `
		SELECT ui.user_id, ui.interest_id, ui.created_at, i.name
		FROM user_interests ui
		JOIN interests i ON ui.interest_id = i.id
		WHERE ui.user_id = $1
		ORDER BY ui.created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving tutor interests: %v", err)
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
			return nil, fmt.Errorf("error scanning tutor interest row: %v", err)
		}

		interest.ID = ui.InterestID
		ui.Interest = &interest

		interests = append(interests, ui)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating tutor interest rows: %v", err)
	}

	return interests, nil
}

// AddTutorAvailability adds availability for a tutor
func (r *TutorRepositoryImpl) AddTutorAvailability(ctx context.Context, availability *entities.TutorAvailability) error {
	query := `
		INSERT INTO tutor_availability (
			tutor_id, day_of_week, start_time, end_time, is_recurring,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $6)
		RETURNING id`

	now := time.Now()
	err := r.DB.QueryRowContext(
		ctx,
		query,
		availability.TutorID,
		availability.DayOfWeek,
		availability.StartTime,
		availability.EndTime,
		availability.IsRecurring,
		now,
	).Scan(&availability.ID)

	if err != nil {
		logger.Error("Failed to add tutor availability",
			"error", err,
			"tutor_id", availability.TutorID)
		return fmt.Errorf("failed to add tutor availability: %v", err)
	}

	availability.CreatedAt = now
	availability.UpdatedAt = now

	logger.Info("Successfully added tutor availability",
		"id", availability.ID,
		"tutor_id", availability.TutorID)
	return nil
}

// GetTutorAvailabilities retrieves all availabilities for a tutor
func (r *TutorRepositoryImpl) GetTutorAvailabilities(ctx context.Context, tutorID int) ([]entities.TutorAvailability, error) {
	query := `
		SELECT id, tutor_id, day_of_week, start_time, end_time, is_recurring,
			   created_at, updated_at
		FROM tutor_availability
		WHERE tutor_id = $1
		ORDER BY day_of_week, start_time`

	rows, err := r.DB.QueryContext(ctx, query, tutorID)
	if err != nil {
		logger.Error("Failed to get tutor availabilities",
			"error", err,
			"tutor_id", tutorID)
		return nil, fmt.Errorf("failed to get tutor availabilities: %v", err)
	}
	defer rows.Close()

	var availabilities []entities.TutorAvailability
	for rows.Next() {
		var availability entities.TutorAvailability

		err := rows.Scan(
			&availability.ID,
			&availability.TutorID,
			&availability.DayOfWeek,
			&availability.StartTime,
			&availability.EndTime,
			&availability.IsRecurring,
			&availability.CreatedAt,
			&availability.UpdatedAt,
		)

		if err != nil {
			logger.Error("Failed to scan tutor availability row",
				"error", err,
				"tutor_id", tutorID)
			return nil, fmt.Errorf("failed to scan tutor availability row: %v", err)
		}

		availabilities = append(availabilities, availability)
	}

	if err = rows.Err(); err != nil {
		logger.Error("Error iterating tutor availability rows",
			"error", err,
			"tutor_id", tutorID)
		return nil, fmt.Errorf("error iterating tutor availability rows: %v", err)
	}

	return availabilities, nil
}

// UpdateTutorAvailability updates an existing availability
func (r *TutorRepositoryImpl) UpdateTutorAvailability(ctx context.Context, availability *entities.TutorAvailability) error {
	query := `
		UPDATE tutor_availability
		SET day_of_week = $1,
			start_time = $2,
			end_time = $3,
			is_recurring = $4,
			updated_at = $5
		WHERE id = $6
		RETURNING updated_at`

	now := time.Now()
	err := r.DB.QueryRowContext(
		ctx,
		query,
		availability.DayOfWeek,
		availability.StartTime,
		availability.EndTime,
		availability.IsRecurring,
		now,
		availability.ID,
	).Scan(&availability.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return fmt.Errorf("availability with ID %d not found", availability.ID)
		}
		logger.Error("Failed to update tutor availability",
			"error", err,
			"id", availability.ID)
		return fmt.Errorf("failed to update tutor availability: %v", err)
	}

	return nil
}

// RemoveTutorAvailability removes an availability
func (r *TutorRepositoryImpl) RemoveTutorAvailability(ctx context.Context, id int) error {
	query := `DELETE FROM tutor_availability WHERE id = $1`

	result, err := r.DB.ExecContext(ctx, query, id)
	if err != nil {
		logger.Error("Failed to remove tutor availability",
			"error", err,
			"id", id)
		return fmt.Errorf("failed to remove tutor availability: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}

	if rows == 0 {
		return fmt.Errorf("availability with ID %d not found", id)
	}

	return nil
}

// Interface implementation methods
func (r *TutorRepositoryImpl) Create(ctx context.Context, tutor *entities.TutorDetails) error {
	// Implementation
	return nil
}

func (r *TutorRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.TutorDetails, error) {
	// Implementation
	return nil, nil
}

func (r *TutorRepositoryImpl) Update(ctx context.Context, tutor *entities.TutorDetails) error {
	// Implementation
	return nil
}

func (r *TutorRepositoryImpl) Delete(ctx context.Context, id int) error {
	// Implementation
	return nil
}

func (r *TutorRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.TutorDetails, error) {
	// Implementation
	return nil, nil
}
