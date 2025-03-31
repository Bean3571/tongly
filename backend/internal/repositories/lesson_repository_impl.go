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
				student_id, tutor_id, language_id, start_time, end_time, 
				notes, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			RETURNING id, created_at, updated_at`

		err := tx.QueryRowContext(ctx, query,
			lesson.StudentID, lesson.TutorID, lesson.LanguageID,
			lesson.StartTime, lesson.EndTime, lesson.Notes,
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
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE l.id = $1`

	lesson := &entities.Lesson{}
	student := &entities.User{}
	tutor := &entities.User{}
	language := &entities.Language{}

	var studentProfilePic, tutorProfilePic sql.NullString
	var cancelledBy sql.NullInt64
	var cancelledAt sql.NullTime
	var notes sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.LanguageID,
		&lesson.StartTime, &lesson.EndTime, &cancelledBy, &cancelledAt, &notes,
		&lesson.CreatedAt, &lesson.UpdatedAt,
		&student.Username, &student.FirstName, &student.LastName, &studentProfilePic,
		&tutor.Username, &tutor.FirstName, &tutor.LastName, &tutorProfilePic,
		&language.Name,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("lesson not found: %v", err)
		}
		return nil, fmt.Errorf("error fetching lesson: %v", err)
	}

	// Set optional fields
	if cancelledBy.Valid {
		cancelledByVal := int(cancelledBy.Int64)
		lesson.CancelledBy = &cancelledByVal
	}

	if cancelledAt.Valid {
		lesson.CancelledAt = &cancelledAt.Time
	}

	if notes.Valid {
		lesson.Notes = &notes.String
	}

	// Set student info
	if studentProfilePic.Valid {
		student.ProfilePictureURL = &studentProfilePic.String
	}
	lesson.Student = student

	// Set tutor info
	if tutorProfilePic.Valid {
		tutor.ProfilePictureURL = &tutorProfilePic.String
	}
	lesson.Tutor = tutor

	// Set language info
	language.ID = lesson.LanguageID
	lesson.Language = language

	return lesson, nil
}

func (r *LessonRepositoryImpl) UpdateLesson(ctx context.Context, lesson *entities.Lesson) error {
	query := `
		UPDATE lessons
		SET cancelled_by = $1, cancelled_at = $2, notes = $3, updated_at = $4
		WHERE id = $5`

	result, err := r.db.ExecContext(ctx, query,
		lesson.CancelledBy, lesson.CancelledAt, lesson.Notes, time.Now(), lesson.ID)
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
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM unique_lessons ul
		JOIN lessons l ON l.id = ul.id
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithData(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE l.tutor_id = $1
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithData(ctx, query, tutorID)
}

func (r *LessonRepositoryImpl) queryLessonsWithData(ctx context.Context, query string, args ...interface{}) ([]entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching lessons: %v", err)
	}
	defer rows.Close()

	var lessons []entities.Lesson

	for rows.Next() {
		var lesson entities.Lesson
		var student entities.User
		var tutor entities.User
		var language entities.Language

		var studentProfilePic, tutorProfilePic sql.NullString
		var cancelledBy sql.NullInt64
		var cancelledAt sql.NullTime
		var notes sql.NullString

		err := rows.Scan(
			&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.LanguageID,
			&lesson.StartTime, &lesson.EndTime, &cancelledBy, &cancelledAt, &notes,
			&lesson.CreatedAt, &lesson.UpdatedAt,
			&student.Username, &student.FirstName, &student.LastName, &studentProfilePic,
			&tutor.Username, &tutor.FirstName, &tutor.LastName, &tutorProfilePic,
			&language.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning lesson row: %v", err)
		}

		// Set optional fields
		if cancelledBy.Valid {
			cancelledByVal := int(cancelledBy.Int64)
			lesson.CancelledBy = &cancelledByVal
		}

		if cancelledAt.Valid {
			lesson.CancelledAt = &cancelledAt.Time
		}

		if notes.Valid {
			lesson.Notes = &notes.String
		}

		// Set student info
		if studentProfilePic.Valid {
			student.ProfilePictureURL = &studentProfilePic.String
		}
		lesson.Student = &student

		// Set tutor info
		if tutorProfilePic.Valid {
			tutor.ProfilePictureURL = &tutorProfilePic.String
		}
		lesson.Tutor = &tutor

		// Set language info
		language.ID = lesson.LanguageID
		lesson.Language = &language

		lessons = append(lessons, lesson)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating lesson rows: %v", err)
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

// Core CRUD operations
func (r *LessonRepositoryImpl) Create(ctx context.Context, lesson *entities.Lesson) error {
	return r.CreateLesson(ctx, lesson)
}

func (r *LessonRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.Lesson, error) {
	return r.GetLesson(ctx, id)
}

func (r *LessonRepositoryImpl) Update(ctx context.Context, lesson *entities.Lesson) error {
	return r.UpdateLesson(ctx, lesson)
}

func (r *LessonRepositoryImpl) Delete(ctx context.Context, id int) error {
	return r.DeleteLesson(ctx, id)
}

func (r *LessonRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.Lesson, error) {
	// Implementation omitted for brevity - would build a dynamic query based on pagination and filters
	return []entities.Lesson{}, nil
}

func (r *LessonRepositoryImpl) GetByTutorID(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	return r.GetLessonsByTutor(ctx, tutorID)
}

func (r *LessonRepositoryImpl) GetByStudentID(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE l.student_id = $1
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithData(ctx, query, studentID)
}

func (r *LessonRepositoryImpl) GetCompletedByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE (l.student_id = $1 OR l.tutor_id = $1)
		AND l.end_time < NOW() 
		AND l.cancelled_at IS NULL
		ORDER BY l.start_time DESC`

	return r.queryLessonsWithData(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetUpcomingByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time, 
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			-- Student info
			s.username, s.first_name, s.last_name, s.profile_picture_url,
			-- Tutor info
			t.username, t.first_name, t.last_name, t.profile_picture_url, 
			-- Language info
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE (l.student_id = $1 OR l.tutor_id = $1)
		AND l.start_time > NOW() 
		AND l.cancelled_at IS NULL
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithData(ctx, query, userID)
}

func (r *LessonRepositoryImpl) CancelLesson(ctx context.Context, lessonID int, userID int) error {
	query := `
		UPDATE lessons
		SET cancelled_by = $1, cancelled_at = $2, updated_at = $3
		WHERE id = $4 AND cancelled_at IS NULL`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, userID, now, now, lessonID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("lesson not found or already cancelled")
	}
	return nil
}
