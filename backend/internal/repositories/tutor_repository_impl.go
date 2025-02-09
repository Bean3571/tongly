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
			user_id, bio, native_languages, teaching_languages, degrees,
			interests, hourly_rate, introduction_video, offers_trial, approved
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	degreesJSON, err := json.Marshal(details.Degrees)
	if err != nil {
		return fmt.Errorf("failed to marshal degrees: %v", err)
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.UserID,
		details.Bio,
		pq.Array(details.NativeLanguages),
		teachingLanguagesJSON,
		degreesJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.OffersTrial,
		details.Approved,
	).Scan(&details.ID)

	if err != nil {
		logger.Error("Failed to create tutor details",
			"error", err,
			"user_id", details.UserID)
		return fmt.Errorf("failed to create tutor details: %v", err)
	}

	return nil
}

func (r *TutorRepositoryImpl) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error) {
	query := `
		SELECT id, user_id, bio, native_languages, teaching_languages, degrees,
			   interests, hourly_rate, introduction_video, offers_trial, approved,
			   created_at, updated_at
		FROM tutor_details
		WHERE user_id = $1`

	var details entities.TutorDetails
	var teachingLanguagesJSON, degreesJSON []byte

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
		&details.Bio,
		pq.Array(&details.NativeLanguages),
		&teachingLanguagesJSON,
		&degreesJSON,
		pq.Array(&details.Interests),
		&details.HourlyRate,
		&details.IntroductionVideo,
		&details.OffersTrial,
		&details.Approved,
		&details.CreatedAt,
		&details.UpdatedAt,
	)

	if err == sql.ErrNoRows {
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
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}
	if err := json.Unmarshal(degreesJSON, &details.Degrees); err != nil {
		return nil, fmt.Errorf("failed to unmarshal degrees: %v", err)
	}

	return &details, nil
}

func (r *TutorRepositoryImpl) UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
		UPDATE tutor_details
		SET bio = $1,
			native_languages = $2,
			teaching_languages = $3,
			degrees = $4,
			interests = $5,
			hourly_rate = $6,
			introduction_video = $7,
			offers_trial = $8,
			approved = $9
		WHERE user_id = $10`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	degreesJSON, err := json.Marshal(details.Degrees)
	if err != nil {
		return fmt.Errorf("failed to marshal degrees: %v", err)
	}

	result, err := r.DB.ExecContext(
		ctx,
		query,
		details.Bio,
		pq.Array(details.NativeLanguages),
		teachingLanguagesJSON,
		degreesJSON,
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
			"user_id", details.UserID)
		return fmt.Errorf("failed to update tutor details: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rows == 0 {
		return fmt.Errorf("tutor details not found for user ID: %d", details.UserID)
	}

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
				td.native_languages,
				td.teaching_languages,
				td.degrees,
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
			degreesJSON      []byte
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
			pq.Array(&details.NativeLanguages),
			&teachingLangJSON,
			&degreesJSON,
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

		// Unmarshal JSON fields
		if err := json.Unmarshal(teachingLangJSON, &details.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}
		if err := json.Unmarshal(degreesJSON, &details.Degrees); err != nil {
			return nil, fmt.Errorf("failed to unmarshal degrees: %v", err)
		}

		details.UserID = creds.ID
		user.Credentials = &creds
		user.Personal = &personal
		user.Tutor = &details

		tutors = append(tutors, &user)
	}

	if err = rows.Err(); err != nil {
		logger.Error("Error iterating tutor rows", "error", err)
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
