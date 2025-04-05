package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"
	"tongly-backend/internal/entities"
)

// LessonRepository handles database operations for lessons
type LessonRepository struct {
	db *sql.DB
}

// NewLessonRepository creates a new LessonRepository
func NewLessonRepository(db *sql.DB) *LessonRepository {
	return &LessonRepository{
		db: db,
	}
}

// Create inserts a new lesson into the database
func (r *LessonRepository) Create(ctx context.Context, lesson *entities.Lesson) error {
	query := `
		INSERT INTO lessons
		(student_id, tutor_id, language_id, start_time, end_time, notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at, updated_at
	`

	err := r.db.QueryRowContext(
		ctx,
		query,
		lesson.StudentID,
		lesson.TutorID,
		lesson.LanguageID,
		lesson.StartTime,
		lesson.EndTime,
		lesson.Notes,
	).Scan(&lesson.ID, &lesson.CreatedAt, &lesson.UpdatedAt)

	return err
}

// GetByID retrieves a lesson by ID
func (r *LessonRepository) GetByID(ctx context.Context, id int) (*entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
		       cancelled_by, cancelled_at, notes, created_at, updated_at
		FROM lessons
		WHERE id = $1
	`

	lesson := &entities.Lesson{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID,
		&lesson.StudentID,
		&lesson.TutorID,
		&lesson.LanguageID,
		&lesson.StartTime,
		&lesson.EndTime,
		&lesson.CancelledBy,
		&lesson.CancelledAt,
		&lesson.Notes,
		&lesson.CreatedAt,
		&lesson.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	return lesson, nil
}

// GetByStudentID retrieves all lessons for a student
func (r *LessonRepository) GetByStudentID(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
		       cancelled_by, cancelled_at, notes, created_at, updated_at
		FROM lessons
		WHERE student_id = $1
		ORDER BY start_time DESC
	`

	return r.getLessonsByQuery(ctx, query, studentID)
}

// GetByTutorID retrieves all lessons for a tutor
func (r *LessonRepository) GetByTutorID(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
		       cancelled_by, cancelled_at, notes, created_at, updated_at
		FROM lessons
		WHERE tutor_id = $1
		ORDER BY start_time DESC
	`

	return r.getLessonsByQuery(ctx, query, tutorID)
}

// GetUpcomingLessons retrieves upcoming lessons for a user (either student or tutor)
func (r *LessonRepository) GetUpcomingLessons(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	var query string
	if isStudent {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE student_id = $1 AND start_time > NOW() AND cancelled_by IS NULL
			ORDER BY start_time ASC
		`
	} else {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND start_time > NOW() AND cancelled_by IS NULL
			ORDER BY start_time ASC
		`
	}

	return r.getLessonsByQuery(ctx, query, userID)
}

// GetPastLessons retrieves past lessons for a user (either student or tutor)
func (r *LessonRepository) GetPastLessons(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	var query string
	if isStudent {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE student_id = $1 AND (end_time < NOW() OR cancelled_by IS NOT NULL)
			ORDER BY start_time DESC
		`
	} else {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND (end_time < NOW() OR cancelled_by IS NOT NULL)
			ORDER BY start_time DESC
		`
	}

	return r.getLessonsByQuery(ctx, query, userID)
}

// Helper function to retrieve lessons by a query and argument
func (r *LessonRepository) getLessonsByQuery(ctx context.Context, query string, arg interface{}) ([]entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, arg)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []entities.Lesson
	for rows.Next() {
		var lesson entities.Lesson
		err := rows.Scan(
			&lesson.ID,
			&lesson.StudentID,
			&lesson.TutorID,
			&lesson.LanguageID,
			&lesson.StartTime,
			&lesson.EndTime,
			&lesson.CancelledBy,
			&lesson.CancelledAt,
			&lesson.Notes,
			&lesson.CreatedAt,
			&lesson.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return lessons, nil
}

// CancelLesson cancels a lesson
func (r *LessonRepository) CancelLesson(ctx context.Context, lessonID, userID int) error {
	query := `
		UPDATE lessons
		SET cancelled_by = $1, cancelled_at = NOW()
		WHERE id = $2
		RETURNING updated_at
	`

	var updatedAt time.Time
	return r.db.QueryRowContext(ctx, query, userID, lessonID).Scan(&updatedAt)
}

// UpdateLessonNotes updates the notes for a lesson
func (r *LessonRepository) UpdateLessonNotes(ctx context.Context, lessonID int, notes string) error {
	query := `
		UPDATE lessons
		SET notes = $1
		WHERE id = $2
		RETURNING updated_at
	`

	var updatedAt time.Time
	return r.db.QueryRowContext(ctx, query, notes, lessonID).Scan(&updatedAt)
}

// AddReview adds a review for a lesson
func (r *LessonRepository) AddReview(ctx context.Context, review *entities.Review) error {
	query := `
		INSERT INTO reviews
		(lesson_id, reviewer_id, rating)
		VALUES ($1, $2, $3)
		RETURNING id, created_at
	`

	return r.db.QueryRowContext(
		ctx,
		query,
		review.LessonID,
		review.ReviewerID,
		review.Rating,
	).Scan(&review.ID, &review.CreatedAt)
}

// GetReviewsByLessonID retrieves all reviews for a lesson
func (r *LessonRepository) GetReviewsByLessonID(ctx context.Context, lessonID int) ([]entities.Review, error) {
	query := `
		SELECT id, lesson_id, reviewer_id, rating, created_at
		FROM reviews
		WHERE lesson_id = $1
	`

	rows, err := r.db.QueryContext(ctx, query, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []entities.Review
	for rows.Next() {
		var review entities.Review
		err := rows.Scan(
			&review.ID,
			&review.LessonID,
			&review.ReviewerID,
			&review.Rating,
			&review.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		reviews = append(reviews, review)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return reviews, nil
}

// GetTutorAverageRating calculates the average rating for a tutor
func (r *LessonRepository) GetTutorAverageRating(ctx context.Context, tutorID int) (float64, error) {
	query := `
		SELECT AVG(r.rating)
		FROM reviews r
		JOIN lessons l ON r.lesson_id = l.id
		WHERE l.tutor_id = $1
	`

	var avgRating sql.NullFloat64
	err := r.db.QueryRowContext(ctx, query, tutorID).Scan(&avgRating)
	if err != nil {
		return 0, err
	}

	if !avgRating.Valid {
		return 0, nil
	}

	return avgRating.Float64, nil
}

// GetTutorReviewsCount counts the number of reviews for a tutor
func (r *LessonRepository) GetTutorReviewsCount(ctx context.Context, tutorID int) (int, error) {
	query := `
		SELECT COUNT(r.id)
		FROM reviews r
		JOIN lessons l ON r.lesson_id = l.id
		WHERE l.tutor_id = $1
	`

	var count int
	err := r.db.QueryRowContext(ctx, query, tutorID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}
