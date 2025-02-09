package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
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
			interests, hourly_rate, introduction_video, offers_trial, approved
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
		"offers_trial", details.OffersTrial,
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
		details.OffersTrial,
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
				"offers_trial":       details.OffersTrial,
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
			   interests, hourly_rate, introduction_video, offers_trial, approved,
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
		&details.OffersTrial,
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
			"offers_trial":       details.OffersTrial,
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
			offers_trial = $7,
			approved = $8
		WHERE user_id = $9`

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

	logger.Info("Updating tutor details",
		"user_id", details.UserID,
		"query", query,
		"params", map[string]interface{}{
			"bio":                details.Bio,
			"teaching_languages": string(teachingLanguagesJSON),
			"education":          string(educationJSON),
			"interests":          details.Interests,
			"hourly_rate":        details.HourlyRate,
			"introduction_video": details.IntroductionVideo,
			"offers_trial":       details.OffersTrial,
			"approved":           details.Approved,
		})

	result, err := r.DB.ExecContext(
		ctx,
		query,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.OffersTrial,
		details.Approved,
		details.UserID,
	)

	if err != nil {
		logger.Error("Failed to update tutor details",
			"error", err,
			"user_id", details.UserID,
			"query", query,
			"params", map[string]interface{}{
				"bio":                details.Bio,
				"teaching_languages": string(teachingLanguagesJSON),
				"education":          string(educationJSON),
				"interests":          details.Interests,
				"hourly_rate":        details.HourlyRate,
				"introduction_video": details.IntroductionVideo,
				"offers_trial":       details.OffersTrial,
				"approved":           details.Approved,
			})
		return fmt.Errorf("failed to update tutor details: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rows == 0 {
		return fmt.Errorf("tutor details not found for user ID: %d", details.UserID)
	}

	logger.Info("Successfully updated tutor details",
		"user_id", details.UserID,
		"rows_affected", rows)
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
				td.offers_trial,
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

	if offersTrial, ok := filters["offers_trial"].(bool); ok {
		query += ` AND offers_trial = $` + strconv.Itoa(argPosition)
		args = append(args, offersTrial)
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
			&details.OffersTrial,
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
