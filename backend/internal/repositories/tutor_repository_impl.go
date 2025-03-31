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

func (r *TutorRepositoryImpl) CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		INSERT INTO tutor_details (
			user_id, bio, teaching_languages, education,
			interests, introduction_video, approved
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		logger.Error("Failed to marshal teaching languages",
			"error", err,
			"teaching_languages", details.TeachingLanguages)
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(details.Education)
	if err != nil {
		logger.Error("Failed to marshal education",
			"error", err,
			"education", details.Education)
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	logger.Info("Creating tutor details",
		"user_id", details.UserID,
		"teaching_languages", string(teachingLanguagesJSON),
		"education", string(educationJSON),
		"introduction_video", details.IntroductionVideo)

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.UserID,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.IntroductionVideo,
		details.Approved,
	).Scan(&details.ID)

	if err != nil {
		logger.Error("Failed to create tutor details",
			"error", err,
			"user_id", details.UserID,
			"query", query,
			"params", map[string]interface{}{
				"user_id":            details.UserID,
				"bio":                details.Bio,
				"teaching_languages": string(teachingLanguagesJSON),
				"education":          string(educationJSON),
				"interests":          details.Interests,
				"introduction_video": details.IntroductionVideo,
				"approved":           details.Approved,
			})
		return fmt.Errorf("failed to create tutor details: %v", err)
	}

	logger.Info("Successfully created tutor details",
		"id", details.ID,
		"user_id", details.UserID)
	return nil
}

func (r *TutorRepositoryImpl) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error) {
	query := `
		SELECT id, user_id, bio, teaching_languages, education,
			   interests, introduction_video, approved,
			   created_at, updated_at
		FROM tutor_details
		WHERE user_id = $1`

	logger.Info("Getting tutor details",
		"user_id", userID,
		"query", query,
		"params", map[string]interface{}{
			"user_id": userID,
		})

	var details entities.TutorDetails
	var teachingLanguagesJSON, educationJSON []byte

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
		&details.Bio,
		&teachingLanguagesJSON,
		&educationJSON,
		pq.Array(&details.Interests),
		&details.IntroductionVideo,
		&details.Approved,
		&details.CreatedAt,
		&details.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		logger.Info("No tutor details found", "user_id", userID)
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get tutor details",
			"error", err,
			"user_id", userID)
		return nil, fmt.Errorf("failed to get tutor details: %v", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(teachingLanguagesJSON, &details.TeachingLanguages); err != nil {
		logger.Error("Failed to unmarshal teaching languages",
			"error", err,
			"json", string(teachingLanguagesJSON))
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}
	if err := json.Unmarshal(educationJSON, &details.Education); err != nil {
		logger.Error("Failed to unmarshal education",
			"error", err,
			"json", string(educationJSON))
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	logger.Info("Successfully retrieved tutor details",
		"user_id", userID,
		"details", map[string]interface{}{
			"id":                 details.ID,
			"teaching_languages": details.TeachingLanguages,
			"education":          details.Education,
			"introduction_video": details.IntroductionVideo,
		})

	return &details, nil
}

func (r *TutorRepositoryImpl) UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		UPDATE tutor_details
		SET bio = $1,
			teaching_languages = $2,
			education = $3,
			interests = $4,
			introduction_video = $5,
			approved = $6
		WHERE user_id = $7
		RETURNING id, teaching_languages, education`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		logger.Error("Failed to marshal teaching languages for update",
			"error", err,
			"teaching_languages", details.TeachingLanguages)
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(details.Education)
	if err != nil {
		logger.Error("Failed to marshal education for update",
			"error", err,
			"education", details.Education)
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	logger.Info("Executing tutor details update",
		"user_id", details.UserID,
		"query_params", map[string]interface{}{
			"bio":                details.Bio,
			"teaching_languages": string(teachingLanguagesJSON),
			"education":          string(educationJSON),
			"interests":          details.Interests,
			"introduction_video": details.IntroductionVideo,
			"approved":           details.Approved,
		})

	var (
		updatedID                int
		updatedTeachingLangsJSON []byte
		updatedEducationJSON     []byte
	)

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.IntroductionVideo,
		details.Approved,
		details.UserID,
	).Scan(&updatedID, &updatedTeachingLangsJSON, &updatedEducationJSON)

	if err != nil {
		logger.Error("Failed to execute update query",
			"error", err,
			"user_id", details.UserID,
			"query", query)
		return fmt.Errorf("failed to update tutor details: %v", err)
	}

	logger.Info("Successfully updated tutor details",
		"user_id", details.UserID,
		"updated_values", map[string]interface{}{
			"id":                      updatedID,
			"teaching_languages_json": string(updatedTeachingLangsJSON),
			"education_json":          string(updatedEducationJSON),
		})

	return nil
}

// ListTutors retrieves a list of tutors with pagination
func (r *TutorRepositoryImpl) ListTutors(ctx context.Context, limit, offset int) ([]entities.TutorProfile, error) {
	query := `
		SELECT 
			td.id, td.user_id, td.bio, td.teaching_languages, td.education,
			td.interests, td.introduction_video, td.approved,
			td.created_at, td.updated_at,
			u.username, u.email, u.first_name, u.last_name, 
			u.profile_picture_url, u.role
		FROM tutor_details td
		JOIN users u ON td.user_id = u.id
		ORDER BY td.id DESC
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
		var teachingLanguagesJSON, educationJSON []byte
		var profilePicURL sql.NullString

		err := rows.Scan(
			&profile.ID,
			&profile.UserID,
			&profile.Bio,
			&teachingLanguagesJSON,
			&educationJSON,
			pq.Array(&profile.Interests),
			&profile.IntroductionVideo,
			&profile.Approved,
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
		if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}

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

func (r *TutorRepositoryImpl) UpdateTutorApprovalStatus(ctx context.Context, userID int, approved bool) error {
	query := `
		UPDATE tutor_details
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
		return fmt.Errorf("tutor details not found for user ID: %d", userID)
	}

	return nil
}

// GetTutorByID retrieves a tutor profile by ID - alias for GetTutorProfile
func (r *TutorRepositoryImpl) GetTutorByID(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	return r.GetTutorProfile(ctx, tutorID)
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

// CreateTutorProfile creates a tutor profile
func (r *TutorRepositoryImpl) CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		INSERT INTO tutor_details (
			user_id, bio, teaching_languages, education, interests,
			introduction_video, approved, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
		RETURNING id, created_at, updated_at`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

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
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(profile.Interests),
		profile.IntroductionVideo,
		profile.Approved,
		now,
	).Scan(&profile.ID, &profile.CreatedAt, &profile.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to create tutor profile: %v", err)
	}

	return nil
}

// UpdateTutorProfile updates a tutor profile
func (r *TutorRepositoryImpl) UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		UPDATE tutor_details
		SET bio = $1,
			teaching_languages = $2,
			interests = $3,
			profile_picture_url = $4,
			introduction_video = $5,
			education = $6,
			approved = $7,
			updated_at = $8
		WHERE id = $9
		RETURNING updated_at`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(profile.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	now := time.Now()
	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.Bio,
		teachingLanguagesJSON,
		pq.Array(profile.Interests),
		profile.ProfilePictureURL,
		profile.IntroductionVideo,
		educationJSON,
		profile.Approved,
		now,
		profile.ID,
	).Scan(&profile.UpdatedAt)

	if err != nil {
		return fmt.Errorf("failed to update tutor profile: %v", err)
	}

	return nil
}

// CreateTutor creates a new tutor profile
func (r *TutorRepositoryImpl) CreateTutor(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		INSERT INTO tutors (
			id, teaching_languages, education, interests, 
			introduction_video, approved
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
	`

	_, err := r.DB.ExecContext(ctx, query,
		details.ID,
		details.TeachingLanguages,
		details.Education,
		details.Interests,
		details.IntroductionVideo,
		details.Approved,
	)

	return err
}

// UpdateTutor updates an existing tutor profile
func (r *TutorRepositoryImpl) UpdateTutor(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		UPDATE tutors
		SET teaching_languages = $1,
			education = $2,
			interests = $3,
			introduction_video = $4,
			approved = $5
		WHERE id = $6
	`

	result, err := r.DB.ExecContext(ctx, query,
		details.TeachingLanguages,
		details.Education,
		details.Interests,
		details.IntroductionVideo,
		details.Approved,
		details.ID,
	)

	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return fmt.Errorf("tutor with ID %d not found", details.ID)
	}

	return nil
}

// SearchTutors searches for tutors based on filters
func (r *TutorRepositoryImpl) SearchTutors(ctx context.Context, filters map[string]interface{}) ([]entities.TutorProfile, error) {
	query := `
		SELECT 
			td.id, td.user_id, td.bio, td.teaching_languages, td.education,
			td.interests, td.introduction_video, td.approved,
			td.created_at, td.updated_at,
			u.username, u.email, u.first_name, u.last_name, 
			u.profile_picture_url, u.role
		FROM tutor_details td
		JOIN users u ON td.user_id = u.id
		WHERE td.approved = true`

	args := []interface{}{}
	argPosition := 1

	// Add filters to query
	if languages, ok := filters["languages"].([]string); ok && len(languages) > 0 {
		query += fmt.Sprintf(` AND teaching_languages ?| $%d`, argPosition)
		args = append(args, pq.Array(languages))
		argPosition++
	}

	// Add ordering
	query += ` ORDER BY td.created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search tutors: %v", err)
	}
	defer rows.Close()

	var tutors []entities.TutorProfile
	for rows.Next() {
		var profile entities.TutorProfile
		var user entities.User
		var teachingLanguagesJSON, educationJSON []byte
		var profilePicURL sql.NullString

		err := rows.Scan(
			&profile.ID,
			&profile.UserID,
			&profile.Bio,
			&teachingLanguagesJSON,
			&educationJSON,
			pq.Array(&profile.Interests),
			&profile.IntroductionVideo,
			&profile.Approved,
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
		if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}

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
		INSERT INTO tutor_availabilities (
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
		FROM tutor_availabilities
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
		UPDATE tutor_availabilities
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
	query := `DELETE FROM tutor_availabilities WHERE id = $1`

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

// GetTutorProfileByUserID retrieves a tutor profile by user ID
func (r *TutorRepositoryImpl) GetTutorProfileByUserID(ctx context.Context, userID int) (*entities.TutorProfile, error) {
	query := `
		SELECT id, user_id, bio, teaching_languages, education, interests,
			introduction_video, approved, created_at, updated_at,
			profile_picture_url
		FROM tutor_details
		WHERE user_id = $1`

	profile := &entities.TutorProfile{}
	var teachingLanguagesJSON, educationJSON []byte
	var profilePicURL sql.NullString

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.Bio,
		&teachingLanguagesJSON,
		&educationJSON,
		pq.Array(&profile.Interests),
		&profile.IntroductionVideo,
		&profile.Approved,
		&profile.CreatedAt,
		&profile.UpdatedAt,
		&profilePicURL,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tutor profile by user ID: %v", err)
	}

	// Handle nullable fields
	if profilePicURL.Valid {
		profile.ProfilePictureURL = &profilePicURL.String
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}

	if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	return profile, nil
}

// GetTutorProfile retrieves a tutor profile by ID
func (r *TutorRepositoryImpl) GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	query := `
		SELECT id, user_id, bio, teaching_languages, education, interests,
			introduction_video, approved, created_at, updated_at,
			profile_picture_url
		FROM tutor_details
		WHERE id = $1`

	profile := &entities.TutorProfile{}
	var teachingLanguagesJSON, educationJSON []byte
	var profilePicURL sql.NullString

	err := r.DB.QueryRowContext(ctx, query, tutorID).Scan(
		&profile.ID,
		&profile.UserID,
		&profile.Bio,
		&teachingLanguagesJSON,
		&educationJSON,
		pq.Array(&profile.Interests),
		&profile.IntroductionVideo,
		&profile.Approved,
		&profile.CreatedAt,
		&profile.UpdatedAt,
		&profilePicURL,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tutor profile: %v", err)
	}

	// Handle nullable fields
	if profilePicURL.Valid {
		profile.ProfilePictureURL = &profilePicURL.String
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}

	if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	return profile, nil
}
