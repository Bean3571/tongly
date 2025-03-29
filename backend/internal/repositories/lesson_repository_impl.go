package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"

	"github.com/lib/pq"
)

type LessonRepositoryImpl struct {
	db *sql.DB
}

func NewLessonRepository(db *sql.DB) LessonRepository {
	return &LessonRepositoryImpl{db: db}
}

// withTx executes a function within a transaction
func (r *LessonRepositoryImpl) withTx(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p) // re-throw panic after rollback
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("error rolling back transaction: %v (original error: %v)", rbErr, err)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %v", err)
	}

	return nil
}

func (r *LessonRepositoryImpl) CreateLesson(ctx context.Context, lesson *entities.Lesson) error {
	return r.withTx(ctx, func(tx *sql.Tx) error {
		now := time.Now()
		query := `
			INSERT INTO lessons (
				student_id, tutor_id, start_time, end_time, cancelled, language, 
				price, duration, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id, created_at, updated_at`

		err := tx.QueryRowContext(ctx, query,
			lesson.StudentID, lesson.TutorID, lesson.StartTime, lesson.EndTime,
			lesson.Cancelled, lesson.Language, lesson.Duration,
			now, now,
		).Scan(&lesson.ID, &lesson.CreatedAt, &lesson.UpdatedAt)

		if err != nil {
			if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
				return errors.New("lesson time slot already booked")
			}
			return fmt.Errorf("failed to create lesson: %v", err)
		}
		return nil
	})
}

func (r *LessonRepositoryImpl) GetLesson(ctx context.Context, id int) (*entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM lessons l
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		WHERE l.id = $1`

	lesson := &entities.Lesson{}
	var studentFirstName, studentLastName, studentAvatarURL sql.NullString
	var tutorFirstName, tutorLastName, tutorAvatarURL sql.NullString
	var studentUsername, tutorUsername string

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
		&lesson.EndTime, &lesson.Duration, &lesson.Cancelled, &lesson.Language,
		&lesson.CreatedAt, &lesson.UpdatedAt,
		&studentUsername, &studentFirstName, &studentLastName, &studentAvatarURL,
		&tutorUsername, &tutorFirstName, &tutorLastName, &tutorAvatarURL,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("lesson not found: %v", err)
		}
		return nil, fmt.Errorf("error fetching lesson: %v", err)
	}

	// Set student info
	lesson.Student = entities.Participant{
		Username: studentUsername,
	}
	if studentFirstName.Valid {
		lesson.Student.FirstName = &studentFirstName.String
	}
	if studentLastName.Valid {
		lesson.Student.LastName = &studentLastName.String
	}
	if studentAvatarURL.Valid {
		lesson.Student.AvatarURL = &studentAvatarURL.String
	}

	// Set tutor info
	lesson.Tutor = entities.Participant{
		Username: tutorUsername,
	}
	if tutorFirstName.Valid {
		lesson.Tutor.FirstName = &tutorFirstName.String
	}
	if tutorLastName.Valid {
		lesson.Tutor.LastName = &tutorLastName.String
	}
	if tutorAvatarURL.Valid {
		lesson.Tutor.AvatarURL = &tutorAvatarURL.String
	}

	return lesson, nil
}

func (r *LessonRepositoryImpl) UpdateLesson(ctx context.Context, lesson *entities.Lesson) error {
	query := `
		UPDATE lessons
		SET cancelled = $1, updated_at = $2
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query,
		lesson.Cancelled, time.Now(), lesson.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("lesson not found")
	}
	return nil
}

func (r *LessonRepositoryImpl) GetLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		WITH unique_lessons AS (
			SELECT DISTINCT ON (l.id) l.id
			FROM lessons l
			WHERE l.student_id = $1 OR l.tutor_id = $1
		)
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM unique_lessons ul
		JOIN lessons l ON l.id = ul.id
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithNames(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM lessons l
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		WHERE l.tutor_id = $1
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithNames(ctx, query, tutorID)
}

func (r *LessonRepositoryImpl) queryLessonsWithNames(ctx context.Context, query string, args ...interface{}) ([]entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error executing query: %v", err)
	}
	defer rows.Close()

	var lessons []entities.Lesson
	for rows.Next() {
		var lesson entities.Lesson
		var studentFirstName, studentLastName, studentAvatarURL sql.NullString
		var tutorFirstName, tutorLastName, tutorAvatarURL sql.NullString
		var studentUsername, tutorUsername string

		err := rows.Scan(
			&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
			&lesson.EndTime, &lesson.Duration, &lesson.Cancelled, &lesson.Language,
			&lesson.CreatedAt, &lesson.UpdatedAt,
			&studentUsername, &studentFirstName, &studentLastName, &studentAvatarURL,
			&tutorUsername, &tutorFirstName, &tutorLastName, &tutorAvatarURL,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning lesson row: %v", err)
		}

		// Set student info
		lesson.Student = entities.Participant{
			Username: studentUsername,
		}
		if studentFirstName.Valid {
			lesson.Student.FirstName = &studentFirstName.String
		}
		if studentLastName.Valid {
			lesson.Student.LastName = &studentLastName.String
		}
		if studentAvatarURL.Valid {
			lesson.Student.AvatarURL = &studentAvatarURL.String
		}

		// Set tutor info
		lesson.Tutor = entities.Participant{
			Username: tutorUsername,
		}
		if tutorFirstName.Valid {
			lesson.Tutor.FirstName = &tutorFirstName.String
		}
		if tutorLastName.Valid {
			lesson.Tutor.LastName = &tutorLastName.String
		}
		if tutorAvatarURL.Valid {
			lesson.Tutor.AvatarURL = &tutorAvatarURL.String
		}

		lessons = append(lessons, lesson)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over rows: %v", err)
	}

	return lessons, nil
}

func (r *LessonRepositoryImpl) DeleteLesson(ctx context.Context, id int) error {
	query := `DELETE FROM lessons WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("lesson not found")
	}
	return nil
}

// Create implements common.Repository
func (r *LessonRepositoryImpl) Create(ctx context.Context, lesson *entities.Lesson) error {
	return r.CreateLesson(ctx, lesson)
}

// GetByID implements common.Repository
func (r *LessonRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.Lesson, error) {
	return r.GetLesson(ctx, id)
}

// Update implements common.Repository
func (r *LessonRepositoryImpl) Update(ctx context.Context, lesson *entities.Lesson) error {
	return r.UpdateLesson(ctx, lesson)
}

// Delete implements common.Repository
func (r *LessonRepositoryImpl) Delete(ctx context.Context, id int) error {
	return r.DeleteLesson(ctx, id)
}

// List implements common.Repository
func (r *LessonRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.Lesson, error) {
	// TODO: Implement pagination and filtering
	// For now, return all lessons
	return r.GetLessonsByTutor(ctx, 0)
}

func (r *LessonRepositoryImpl) GetByTutorID(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	return r.GetLessonsByTutor(ctx, tutorID)
}

func (r *LessonRepositoryImpl) GetByStudentID(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM lessons l
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		WHERE l.student_id = $1
		ORDER BY l.start_time DESC`

	return r.queryLessonsWithNames(ctx, query, studentID)
}

func (r *LessonRepositoryImpl) GetCompletedByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM lessons l
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		WHERE (l.student_id = $1 OR l.tutor_id = $1)
		AND l.cancelled = FALSE
		AND l.end_time < NOW()
		ORDER BY l.start_time DESC`

	return r.queryLessonsWithNames(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetUpcomingByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.cancelled, l.language, l.price, l.created_at, l.updated_at,
			-- Student info
			lp.student_username, lp.student_first_name, lp.student_last_name, lp.student_avatar_url,
			-- Tutor info
			lp.tutor_username, lp.tutor_first_name, lp.tutor_last_name, lp.tutor_avatar_url
		FROM lessons l
		LEFT JOIN lesson_participants lp ON l.id = lp.lesson_id
		WHERE (l.student_id = $1 OR l.tutor_id = $1)
		AND l.cancelled = FALSE
		AND l.start_time > NOW()
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithNames(ctx, query, userID)
}

// CancelLesson cancels a lesson
func (r *LessonRepositoryImpl) CancelLesson(ctx context.Context, lessonID int) error {
	return r.withTx(ctx, func(tx *sql.Tx) error {
		// First check if the lesson can be cancelled
		var startTime time.Time
		var cancelled bool
		err := tx.QueryRowContext(ctx, `
			SELECT start_time, cancelled
			FROM lessons
			WHERE id = $1`, lessonID).Scan(&startTime, &cancelled)
		if err != nil {
			return fmt.Errorf("error fetching lesson: %v", err)
		}

		if cancelled {
			return entities.ErrInvalidStatusTransition
		}

		if time.Until(startTime) < 24*time.Hour {
			return entities.ErrLessonNotCancellable
		}

		// If checks pass, cancel the lesson
		query := `
			UPDATE lessons
			SET cancelled = TRUE, updated_at = NOW()
			WHERE id = $2`

		_, err = tx.ExecContext(ctx, query, lessonID)
		if err != nil {
			return fmt.Errorf("error cancelling lesson: %v", err)
		}

		return nil
	})
}
