package repositories

import (
	"context"
	"database/sql"
	"errors"
	"tongly-basic/models"

	"github.com/jmoiron/sqlx"
)

type TutorRepository interface {
	Register(ctx context.Context, userID int64, data models.TutorRegistrationData) (*models.Tutor, error)
	GetByID(ctx context.Context, id int64) (*models.Tutor, error)
	GetByUserID(ctx context.Context, userID int64) (*models.Tutor, error)
	Update(ctx context.Context, id int64, data models.TutorRegistrationData) (*models.Tutor, error)
	Delete(ctx context.Context, id int64) error
}

type tutorRepository struct {
	db *sqlx.DB
}

func NewTutorRepository(db *sqlx.DB) TutorRepository {
	return &tutorRepository{db: db}
}

func (r *tutorRepository) Register(ctx context.Context, userID int64, data models.TutorRegistrationData) (*models.Tutor, error) {
	// Check if user is already a tutor
	var exists bool
	err := r.db.GetContext(ctx, &exists, `
        SELECT EXISTS(SELECT 1 FROM tutors WHERE user_id = $1)
    `, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user is already registered as a tutor")
	}

	// Insert new tutor
	tutor := &models.Tutor{
		UserID:             userID,
		Bio:                data.Bio,
		Education:          models.StringArray(data.Education),
		Certificates:       models.StringArray(data.Certificates),
		TeachingExperience: data.TeachingExperience,
		HourlyRate:         data.HourlyRate,
		SchedulePreset:     data.SchedulePreset,
		MinLessonDuration:  data.MinLessonDuration,
		MaxStudents:        data.MaxStudents,
		TrialAvailable:     data.TrialAvailable,
		TrialPrice:         data.TrialPrice,
		Languages:          models.TutorLanguages(data.Languages),
		Availability:       models.Availability(data.Availability),
	}

	query := `
        INSERT INTO tutors (
            user_id, bio, education, certificates, teaching_experience,
            hourly_rate, schedule_preset, min_lesson_duration, max_students,
            trial_available, trial_price, languages, availability
        ) VALUES (
            :user_id, :bio, :education, :certificates, :teaching_experience,
            :hourly_rate, :schedule_preset, :min_lesson_duration, :max_students,
            :trial_available, :trial_price, :languages, :availability
        ) RETURNING id, created_at, updated_at
    `

	rows, err := r.db.NamedQueryContext(ctx, query, tutor)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.StructScan(tutor)
		if err != nil {
			return nil, err
		}
		return tutor, nil
	}

	return nil, sql.ErrNoRows
}

func (r *tutorRepository) GetByID(ctx context.Context, id int64) (*models.Tutor, error) {
	tutor := &models.Tutor{}
	err := r.db.GetContext(ctx, tutor, `
        SELECT * FROM tutors WHERE id = $1
    `, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return tutor, nil
}

func (r *tutorRepository) GetByUserID(ctx context.Context, userID int64) (*models.Tutor, error) {
	tutor := &models.Tutor{}
	err := r.db.GetContext(ctx, tutor, `
        SELECT * FROM tutors WHERE user_id = $1
    `, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return tutor, nil
}

func (r *tutorRepository) Update(ctx context.Context, id int64, data models.TutorRegistrationData) (*models.Tutor, error) {
	tutor := &models.Tutor{
		ID:                 id,
		Bio:                data.Bio,
		Education:          models.StringArray(data.Education),
		Certificates:       models.StringArray(data.Certificates),
		TeachingExperience: data.TeachingExperience,
		HourlyRate:         data.HourlyRate,
		SchedulePreset:     data.SchedulePreset,
		MinLessonDuration:  data.MinLessonDuration,
		MaxStudents:        data.MaxStudents,
		TrialAvailable:     data.TrialAvailable,
		TrialPrice:         data.TrialPrice,
		Languages:          models.TutorLanguages(data.Languages),
		Availability:       models.Availability(data.Availability),
	}

	query := `
        UPDATE tutors SET
            bio = :bio,
            education = :education,
            certificates = :certificates,
            teaching_experience = :teaching_experience,
            hourly_rate = :hourly_rate,
            schedule_preset = :schedule_preset,
            min_lesson_duration = :min_lesson_duration,
            max_students = :max_students,
            trial_available = :trial_available,
            trial_price = :trial_price,
            languages = :languages,
            availability = :availability,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = :id
        RETURNING *
    `

	rows, err := r.db.NamedQueryContext(ctx, query, tutor)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if rows.Next() {
		err = rows.StructScan(tutor)
		if err != nil {
			return nil, err
		}
		return tutor, nil
	}

	return nil, sql.ErrNoRows
}

func (r *tutorRepository) Delete(ctx context.Context, id int64) error {
	result, err := r.db.ExecContext(ctx, `
        DELETE FROM tutors WHERE id = $1
    `, id)
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
