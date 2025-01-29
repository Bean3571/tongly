package repositories

import (
	"database/sql"
	"encoding/json"
	"tongly-basic/backend/internal/entities"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type TutorRepositoryImpl struct {
	DB *sqlx.DB
}

func NewTutorRepository(db *sqlx.DB) TutorRepository {
	return &TutorRepositoryImpl{DB: db}
}

func (r *TutorRepositoryImpl) CreateTutor(tutor *entities.Tutor) error {
	// Convert arrays to JSON
	languagesJSON, err := json.Marshal(tutor.Languages)
	if err != nil {
		return err
	}

	availabilityJSON, err := json.Marshal(tutor.Availability)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO tutors (
			user_id, bio, education, certificates, teaching_experience,
			hourly_rate, schedule_preset, min_lesson_duration, max_students,
			trial_available, trial_price, languages, availability
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		) RETURNING id, created_at, updated_at`

	return r.DB.QueryRowx(
		query,
		tutor.UserID,
		tutor.Bio,
		pq.Array(tutor.Education),
		pq.Array(tutor.Certificates),
		tutor.TeachingExperience,
		tutor.HourlyRate,
		tutor.SchedulePreset,
		tutor.MinLessonDuration,
		tutor.MaxStudents,
		tutor.TrialAvailable,
		tutor.TrialPrice,
		languagesJSON,
		availabilityJSON,
	).Scan(&tutor.ID, &tutor.CreatedAt, &tutor.UpdatedAt)
}

func (r *TutorRepositoryImpl) GetTutorByID(id int) (*entities.Tutor, error) {
	var tutor entities.Tutor
	var languagesJSON, availabilityJSON []byte
	var education, certificates []string

	query := `
		SELECT id, user_id, bio, education, certificates, teaching_experience,
			   hourly_rate, schedule_preset, min_lesson_duration, max_students,
			   trial_available, trial_price, languages, availability, created_at, updated_at
		FROM tutors WHERE id = $1`

	err := r.DB.QueryRowx(query, id).Scan(
		&tutor.ID,
		&tutor.UserID,
		&tutor.Bio,
		pq.Array(&education),
		pq.Array(&certificates),
		&tutor.TeachingExperience,
		&tutor.HourlyRate,
		&tutor.SchedulePreset,
		&tutor.MinLessonDuration,
		&tutor.MaxStudents,
		&tutor.TrialAvailable,
		&tutor.TrialPrice,
		&languagesJSON,
		&availabilityJSON,
		&tutor.CreatedAt,
		&tutor.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	tutor.Education = education
	tutor.Certificates = certificates

	// Unmarshal JSON fields
	if err := json.Unmarshal(languagesJSON, &tutor.Languages); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(availabilityJSON, &tutor.Availability); err != nil {
		return nil, err
	}

	return &tutor, nil
}

func (r *TutorRepositoryImpl) GetTutorByUserID(userID int) (*entities.Tutor, error) {
	var tutor entities.Tutor
	var languagesJSON, availabilityJSON []byte
	var education, certificates []string

	query := `
		SELECT id, user_id, bio, education, certificates, teaching_experience,
			   hourly_rate, schedule_preset, min_lesson_duration, max_students,
			   trial_available, trial_price, languages, availability, created_at, updated_at
		FROM tutors WHERE user_id = $1`

	err := r.DB.QueryRowx(query, userID).Scan(
		&tutor.ID,
		&tutor.UserID,
		&tutor.Bio,
		pq.Array(&education),
		pq.Array(&certificates),
		&tutor.TeachingExperience,
		&tutor.HourlyRate,
		&tutor.SchedulePreset,
		&tutor.MinLessonDuration,
		&tutor.MaxStudents,
		&tutor.TrialAvailable,
		&tutor.TrialPrice,
		&languagesJSON,
		&availabilityJSON,
		&tutor.CreatedAt,
		&tutor.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	tutor.Education = education
	tutor.Certificates = certificates

	// Unmarshal JSON fields
	if err := json.Unmarshal(languagesJSON, &tutor.Languages); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(availabilityJSON, &tutor.Availability); err != nil {
		return nil, err
	}

	return &tutor, nil
}

func (r *TutorRepositoryImpl) UpdateTutor(tutor *entities.Tutor) error {
	// Convert arrays to JSON
	languagesJSON, err := json.Marshal(tutor.Languages)
	if err != nil {
		return err
	}

	availabilityJSON, err := json.Marshal(tutor.Availability)
	if err != nil {
		return err
	}

	query := `
		UPDATE tutors SET
			bio = $1,
			education = $2,
			certificates = $3,
			teaching_experience = $4,
			hourly_rate = $5,
			schedule_preset = $6,
			min_lesson_duration = $7,
			max_students = $8,
			trial_available = $9,
			trial_price = $10,
			languages = $11,
			availability = $12,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $13
		RETURNING updated_at`

	return r.DB.QueryRowx(
		query,
		tutor.Bio,
		pq.Array(tutor.Education),
		pq.Array(tutor.Certificates),
		tutor.TeachingExperience,
		tutor.HourlyRate,
		tutor.SchedulePreset,
		tutor.MinLessonDuration,
		tutor.MaxStudents,
		tutor.TrialAvailable,
		tutor.TrialPrice,
		languagesJSON,
		availabilityJSON,
		tutor.ID,
	).Scan(&tutor.UpdatedAt)
}

func (r *TutorRepositoryImpl) ListTutors() ([]entities.Tutor, error) {
	query := `
		SELECT id, user_id, bio, education, certificates, teaching_experience,
			   hourly_rate, schedule_preset, min_lesson_duration, max_students,
			   trial_available, trial_price, languages, availability, created_at, updated_at
		FROM tutors`

	rows, err := r.DB.Queryx(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tutors []entities.Tutor
	for rows.Next() {
		var tutor entities.Tutor
		var languagesJSON, availabilityJSON []byte
		var education, certificates []string

		err := rows.Scan(
			&tutor.ID,
			&tutor.UserID,
			&tutor.Bio,
			pq.Array(&education),
			pq.Array(&certificates),
			&tutor.TeachingExperience,
			&tutor.HourlyRate,
			&tutor.SchedulePreset,
			&tutor.MinLessonDuration,
			&tutor.MaxStudents,
			&tutor.TrialAvailable,
			&tutor.TrialPrice,
			&languagesJSON,
			&availabilityJSON,
			&tutor.CreatedAt,
			&tutor.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		tutor.Education = education
		tutor.Certificates = certificates

		// Unmarshal JSON fields
		if err := json.Unmarshal(languagesJSON, &tutor.Languages); err != nil {
			return nil, err
		}
		if err := json.Unmarshal(availabilityJSON, &tutor.Availability); err != nil {
			return nil, err
		}

		tutors = append(tutors, tutor)
	}

	return tutors, nil
}

func (r *TutorRepositoryImpl) DeleteTutor(id int) error {
	query := `DELETE FROM tutors WHERE id = $1`
	result, err := r.DB.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
