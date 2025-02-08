package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

	"github.com/lib/pq"
)

type TutorRepositoryImpl struct {
	DB *sql.DB
}

func (r *TutorRepositoryImpl) CreateTutor(ctx context.Context, tutor *entities.Tutor) error {
	query := `
		INSERT INTO tutors (
			user_id, education_degree, education_institution, 
			introduction_video, hourly_rate, offers_trial, approval_status
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`

	err := r.DB.QueryRowContext(
		ctx,
		query,
		tutor.UserID,
		tutor.EducationDegree,
		tutor.EducationInstitution,
		tutor.IntroductionVideo,
		tutor.HourlyRate,
		tutor.OffersTrial,
		tutor.ApprovalStatus,
	).Scan(&tutor.ID, &tutor.CreatedAt, &tutor.UpdatedAt)

	if err != nil {
		logger.Error("Failed to create tutor", "error", err)
		return err
	}

	return nil
}

func (r *TutorRepositoryImpl) GetTutorByID(ctx context.Context, id int) (*entities.Tutor, error) {
	query := `
		SELECT t.id, t.user_id, t.education_degree, t.education_institution,
			   t.introduction_video, t.hourly_rate, t.offers_trial, t.approval_status,
			   t.created_at, t.updated_at
		FROM tutors t
		WHERE t.id = $1`

	tutor := &entities.Tutor{}
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&tutor.ID,
		&tutor.UserID,
		&tutor.EducationDegree,
		&tutor.EducationInstitution,
		&tutor.IntroductionVideo,
		&tutor.HourlyRate,
		&tutor.OffersTrial,
		&tutor.ApprovalStatus,
		&tutor.CreatedAt,
		&tutor.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get tutor by ID", "error", err)
		return nil, err
	}

	return tutor, nil
}

func (r *TutorRepositoryImpl) GetTutorByUserID(ctx context.Context, userID int) (*entities.Tutor, error) {
	query := `
		SELECT t.id, t.user_id, t.education_degree, t.education_institution,
			   t.introduction_video, t.hourly_rate, t.offers_trial, t.approval_status,
			   t.created_at, t.updated_at
		FROM tutors t
		WHERE t.user_id = $1`

	tutor := &entities.Tutor{}
	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&tutor.ID,
		&tutor.UserID,
		&tutor.EducationDegree,
		&tutor.EducationInstitution,
		&tutor.IntroductionVideo,
		&tutor.HourlyRate,
		&tutor.OffersTrial,
		&tutor.ApprovalStatus,
		&tutor.CreatedAt,
		&tutor.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get tutor by user ID", "error", err)
		return nil, err
	}

	return tutor, nil
}

func (r *TutorRepositoryImpl) ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.Tutor, error) {
	query := `
		SELECT t.id, t.user_id, t.education_degree, t.education_institution,
			   t.introduction_video, t.hourly_rate, t.offers_trial, t.approval_status,
			   t.created_at, t.updated_at
		FROM tutors t
		WHERE 1=1`

	args := []interface{}{}
	argPosition := 1

	if status, ok := filters["approval_status"]; ok {
		query += ` AND t.approval_status = $` + strconv.Itoa(argPosition)
		args = append(args, status)
		argPosition++
	}

	if minRate, ok := filters["min_hourly_rate"]; ok {
		query += ` AND t.hourly_rate >= $` + strconv.Itoa(argPosition)
		args = append(args, minRate)
		argPosition++
	}

	if maxRate, ok := filters["max_hourly_rate"]; ok {
		query += ` AND t.hourly_rate <= $` + strconv.Itoa(argPosition)
		args = append(args, maxRate)
		argPosition++
	}

	if offersTrial, ok := filters["offers_trial"]; ok {
		query += ` AND t.offers_trial = $` + strconv.Itoa(argPosition)
		args = append(args, offersTrial)
		argPosition++
	}

	query += ` ORDER BY t.created_at DESC LIMIT $` + strconv.Itoa(argPosition) + ` OFFSET $` + strconv.Itoa(argPosition+1)
	args = append(args, limit, offset)

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		logger.Error("Failed to list tutors", "error", err)
		return nil, err
	}
	defer rows.Close()

	var tutors []*entities.Tutor
	for rows.Next() {
		tutor := &entities.Tutor{}
		err := rows.Scan(
			&tutor.ID,
			&tutor.UserID,
			&tutor.EducationDegree,
			&tutor.EducationInstitution,
			&tutor.IntroductionVideo,
			&tutor.HourlyRate,
			&tutor.OffersTrial,
			&tutor.ApprovalStatus,
			&tutor.CreatedAt,
			&tutor.UpdatedAt,
		)
		if err != nil {
			logger.Error("Failed to scan tutor row", "error", err)
			return nil, err
		}
		tutors = append(tutors, tutor)
	}

	return tutors, nil
}

func (r *TutorRepositoryImpl) UpdateTutorApprovalStatus(ctx context.Context, tutorID int, status string) error {
	query := `
		UPDATE tutors 
		SET approval_status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2`

	result, err := r.DB.ExecContext(ctx, query, status, tutorID)
	if err != nil {
		logger.Error("Failed to update tutor approval status", "error", err)
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		logger.Error("Failed to get rows affected", "error", err)
		return err
	}

	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *TutorRepositoryImpl) UpdateTutor(ctx context.Context, tutor *entities.Tutor) error {
	query := `
		UPDATE tutors 
		SET education_degree = $1,
			education_institution = $2,
			hourly_rate = $3,
			offers_trial = $4,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING id`

	var id int
	err := r.DB.QueryRowContext(
		ctx,
		query,
		tutor.EducationDegree,
		tutor.EducationInstitution,
		tutor.HourlyRate,
		tutor.OffersTrial,
		tutor.ID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update tutor",
			"error", err,
			"tutor_id", tutor.ID)
		return err
	}

	logger.Info("Tutor updated successfully", "tutor_id", tutor.ID)
	return nil
}

func (r *TutorRepositoryImpl) CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		INSERT INTO tutor_profiles (
			tutor_id, native_languages, teaching_languages, bio, interests, profile_picture
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		logger.Error("Failed to marshal teaching languages", "error", err)
		return err
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		profile.TutorID,
		pq.Array(profile.NativeLanguages),
		teachingLanguagesJSON,
		profile.Bio,
		pq.Array(profile.Interests),
		profile.ProfilePicture,
	).Scan(&profile.ID, &profile.CreatedAt, &profile.UpdatedAt)

	if err != nil {
		logger.Error("Failed to create tutor profile", "error", err)
		return err
	}

	return nil
}

func (r *TutorRepositoryImpl) GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	query := `
		SELECT id, tutor_id, native_languages, teaching_languages, bio, interests, 
			   profile_picture, created_at, updated_at
		FROM tutor_profiles
		WHERE tutor_id = $1`

	profile := &entities.TutorProfile{}
	var teachingLanguagesJSON []byte

	err := r.DB.QueryRowContext(ctx, query, tutorID).Scan(
		&profile.ID,
		&profile.TutorID,
		pq.Array(&profile.NativeLanguages),
		&teachingLanguagesJSON,
		&profile.Bio,
		pq.Array(&profile.Interests),
		&profile.ProfilePicture,
		&profile.CreatedAt,
		&profile.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get tutor profile", "error", err)
		return nil, err
	}

	if len(teachingLanguagesJSON) > 0 {
		err = json.Unmarshal(teachingLanguagesJSON, &profile.TeachingLanguages)
		if err != nil {
			logger.Error("Failed to unmarshal teaching languages", "error", err)
			return nil, err
		}
	}

	return profile, nil
}

func (r *TutorRepositoryImpl) UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error {
	query := `
		UPDATE tutor_profiles 
		SET native_languages = $1,
			teaching_languages = $2,
			bio = $3,
			interests = $4,
			profile_picture = COALESCE($5, profile_picture),
			updated_at = CURRENT_TIMESTAMP
		WHERE tutor_id = $6
		RETURNING id`

	teachingLanguagesJSON, err := json.Marshal(profile.TeachingLanguages)
	if err != nil {
		logger.Error("Failed to marshal teaching languages", "error", err)
		return err
	}

	var id int
	err = r.DB.QueryRowContext(
		ctx,
		query,
		pq.Array(profile.NativeLanguages),
		teachingLanguagesJSON,
		profile.Bio,
		pq.Array(profile.Interests),
		profile.ProfilePicture,
		profile.TutorID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update tutor profile", "error", err)
		return err
	}

	return nil
}
