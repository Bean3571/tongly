package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

	"github.com/lib/pq"
)

type TutorRepositoryImpl struct {
	DB *sql.DB
}

func (r *TutorRepositoryImpl) CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		INSERT INTO tutor_details (
			user_id, bio, teaching_languages, education,
			interests, hourly_rate, introduction_video, approved
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
		"hourly_rate", details.HourlyRate,
		"introduction_video", details.IntroductionVideo)

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.UserID,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
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
				"hourly_rate":        details.HourlyRate,
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
			   interests, hourly_rate, introduction_video, approved,
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
		&details.HourlyRate,
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
			"hourly_rate":        details.HourlyRate,
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
			hourly_rate = $5,
			introduction_video = $6,
			approved = $7
		WHERE user_id = $8
		RETURNING id, teaching_languages, education, hourly_rate, offers_trial`

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
			"hourly_rate":        details.HourlyRate,
			"introduction_video": details.IntroductionVideo,
			"approved":           details.Approved,
		})

	var (
		updatedID                int
		updatedTeachingLangsJSON []byte
		updatedEducationJSON     []byte
		updatedHourlyRate        float64
	)

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.Approved,
		details.UserID,
	).Scan(&updatedID, &updatedTeachingLangsJSON, &updatedEducationJSON, &updatedHourlyRate)

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
			"hourly_rate":             updatedHourlyRate,
		})

	return nil
}

func (r *TutorRepositoryImpl) ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.User, error) {
	query := `
		WITH tutor_data AS (
			SELECT 
				uc.id as user_id,
				uc.username,
				uc.email,
				uc.role,
				up.first_name,
				up.last_name,
				up.profile_picture,
				td.bio,
				td.teaching_languages,
				td.education,
				td.interests,
				td.hourly_rate,
				td.introduction_video,
				td.approved
			FROM user_credentials uc
			LEFT JOIN user_personal up ON uc.id = up.user_id
			LEFT JOIN tutor_details td ON uc.id = td.user_id
			WHERE uc.role = 'tutor'
		)
		SELECT * FROM tutor_data WHERE 1=1`

	args := []interface{}{}
	argPosition := 1

	// Add filters
	if language, ok := filters["language"].(string); ok && language != "" {
		query += ` AND teaching_languages @> $` + strconv.Itoa(argPosition) + `::jsonb`
		languageFilter := fmt.Sprintf(`[{"language":"%s"}]`, language)
		args = append(args, languageFilter)
		argPosition++
	}

	if minRate, ok := filters["min_hourly_rate"].(float64); ok && minRate > 0 {
		query += ` AND hourly_rate >= $` + strconv.Itoa(argPosition)
		args = append(args, minRate)
		argPosition++
	}

	if maxRate, ok := filters["max_hourly_rate"].(float64); ok && maxRate > 0 {
		query += ` AND hourly_rate <= $` + strconv.Itoa(argPosition)
		args = append(args, maxRate)
		argPosition++
	}

	// Add pagination
	query += ` ORDER BY user_id DESC LIMIT $` + strconv.Itoa(argPosition) +
		` OFFSET $` + strconv.Itoa(argPosition+1)
	args = append(args, limit, offset)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		logger.Error("Failed to list tutors", "error", err)
		return nil, fmt.Errorf("failed to list tutors: %v", err)
	}
	defer rows.Close()

	var tutors []*entities.User
	for rows.Next() {
		var (
			user             entities.User
			creds            entities.UserCredentials
			personal         entities.UserPersonal
			details          entities.TutorDetails
			teachingLangJSON []byte
			educationJSON    []byte
		)

		err := rows.Scan(
			&creds.ID,
			&creds.Username,
			&creds.Email,
			&creds.Role,
			&personal.FirstName,
			&personal.LastName,
			&personal.ProfilePicture,
			&details.Bio,
			&teachingLangJSON,
			&educationJSON,
			pq.Array(&details.Interests),
			&details.HourlyRate,
			&details.IntroductionVideo,
			&details.Approved,
		)

		if err != nil {
			logger.Error("Failed to scan tutor row", "error", err)
			return nil, fmt.Errorf("failed to scan tutor row: %v", err)
		}

		if err := json.Unmarshal(teachingLangJSON, &details.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}

		if err := json.Unmarshal(educationJSON, &details.Education); err != nil {
			return nil, fmt.Errorf("failed to unmarshal education: %v", err)
		}

		user.Credentials = &creds
		user.Personal = &personal
		user.Tutor = &details
		tutors = append(tutors, &user)
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

// GetTutorByID retrieves tutor details by tutor ID
func (r *TutorRepositoryImpl) GetTutorByID(ctx context.Context, tutorID int) (*entities.TutorDetails, error) {
	return r.GetTutorDetails(ctx, tutorID)
}

func (r *TutorRepositoryImpl) CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		INSERT INTO tutor_profiles (
			tutor_id, bio, teaching_languages, interests, profile_picture,
			hourly_rate, introduction_video, education,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(profile.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.TutorID,
		profile.Bio,
		teachingLanguagesJSON,
		pq.Array(profile.Interests),
		profile.ProfilePicture,
		profile.HourlyRate,
		profile.IntroductionVideo,
		educationJSON,
		time.Now(),
		time.Now(),
	).Scan(&profile.ID)

	if err != nil {
		return fmt.Errorf("failed to create tutor profile: %v", err)
	}

	return nil
}

func (r *TutorRepositoryImpl) GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	query := `
		SELECT id, tutor_id, bio, teaching_languages, interests, profile_picture,
			hourly_rate, introduction_video, education,
			created_at, updated_at
		FROM tutor_profiles
		WHERE tutor_id = $1`

	profile := &entities.TutorProfile{}
	var teachingLanguagesJSON, educationJSON []byte

	err := r.DB.QueryRowContext(ctx, query, tutorID).Scan(
		&profile.ID,
		&profile.TutorID,
		&profile.Bio,
		&teachingLanguagesJSON,
		pq.Array(&profile.Interests),
		&profile.ProfilePicture,
		&profile.HourlyRate,
		&profile.IntroductionVideo,
		&educationJSON,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get tutor profile: %v", err)
	}

	if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}

	if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	return profile, nil
}

func (r *TutorRepositoryImpl) UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		UPDATE tutor_profiles
		SET bio = $1,
			teaching_languages = $2,
			interests = $3,
			profile_picture = $4,
			hourly_rate = $5,
			introduction_video = $6,
			education = $7,
			updated_at = $8
		WHERE tutor_id = $9
		RETURNING id`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(profile.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.Bio,
		teachingLanguagesJSON,
		pq.Array(profile.Interests),
		profile.ProfilePicture,
		profile.HourlyRate,
		profile.IntroductionVideo,
		educationJSON,
		time.Now(),
		profile.TutorID,
	).Scan(&profile.ID)

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
			hourly_rate, introduction_video, approved
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err := r.DB.ExecContext(ctx, query,
		details.ID,
		details.TeachingLanguages,
		details.Education,
		details.Interests,
		details.HourlyRate,
		details.IntroductionVideo,
		details.Approved,
	)

	return err
}

// UpdateTutor updates an existing tutor profile
func (r *TutorRepositoryImpl) UpdateTutor(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		UPDATE tutors SET
			teaching_languages = $2,
			education = $3,
			interests = $4,
			hourly_rate = $5,
			introduction_video = $6,
			approved = $7,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`

	result, err := r.DB.ExecContext(ctx, query,
		details.ID,
		details.TeachingLanguages,
		details.Education,
		details.Interests,
		details.HourlyRate,
		details.IntroductionVideo,
		details.Approved,
	)

	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return fmt.Errorf("tutor not found")
	}

	return nil
}

// SearchTutors searches for tutors based on filters
func (r *TutorRepositoryImpl) SearchTutors(ctx context.Context, filters map[string]interface{}) ([]*entities.TutorProfile, error) {
	query := `
		SELECT id, user_id, bio, teaching_languages, education,
			   interests, hourly_rate, introduction_video
		FROM tutor_details
		WHERE approved = true`

	args := []interface{}{}
	argPosition := 1

	// Add filters to query
	if languages, ok := filters["languages"].([]string); ok && len(languages) > 0 {
		query += fmt.Sprintf(` AND teaching_languages ?| $%d`, argPosition)
		args = append(args, pq.Array(languages))
		argPosition++
	}

	if minPrice, ok := filters["min_price"].(float64); ok && minPrice > 0 {
		query += fmt.Sprintf(` AND hourly_rate >= $%d`, argPosition)
		args = append(args, minPrice)
		argPosition++
	}

	if maxPrice, ok := filters["max_price"].(float64); ok && maxPrice > 0 {
		query += fmt.Sprintf(` AND hourly_rate <= $%d`, argPosition)
		args = append(args, maxPrice)
		argPosition++
	}

	// Add ordering
	query += ` ORDER BY created_at DESC`

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search tutors: %v", err)
	}
	defer rows.Close()

	var tutors []*entities.TutorProfile
	for rows.Next() {
		profile := &entities.TutorProfile{}
		var teachingLanguagesJSON, educationJSON []byte

		err := rows.Scan(
			&profile.ID,
			&profile.TutorID,
			&profile.Bio,
			&teachingLanguagesJSON,
			&educationJSON,
			pq.Array(&profile.Interests),
			&profile.HourlyRate,
			&profile.IntroductionVideo,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan tutor row: %v", err)
		}

		if err := json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}

		if err := json.Unmarshal(educationJSON, &profile.Education); err != nil {
			return nil, fmt.Errorf("failed to unmarshal education: %v", err)
		}

		tutors = append(tutors, profile)
	}

	return tutors, nil
}
