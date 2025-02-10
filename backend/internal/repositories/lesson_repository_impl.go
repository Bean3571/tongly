package repositories

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"tongly-backend/internal/entities"

	"github.com/lib/pq"
)

type lessonRepositoryImpl struct {
	db *sql.DB
}

func NewLessonRepository(db *sql.DB) LessonRepository {
	return &lessonRepositoryImpl{db: db}
}

func (r *lessonRepositoryImpl) CreateLesson(ctx context.Context, lesson *entities.Lesson) error {
	query := `
		INSERT INTO lessons (student_id, tutor_id, start_time, end_time, status, language, 
			price, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, query,
		lesson.StudentID, lesson.TutorID, lesson.StartTime, lesson.EndTime,
		lesson.Status, lesson.Language, lesson.Price, time.Now(), time.Now(),
	).Scan(&lesson.ID)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			return errors.New("lesson time slot already booked")
		}
		return err
	}
	return nil
}

func (r *lessonRepositoryImpl) GetLessonByID(ctx context.Context, id int) (*entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE id = $1`

	lesson := &entities.Lesson{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
		&lesson.EndTime, &lesson.Status, &lesson.Language,
		&lesson.Price, &lesson.CreatedAt, &lesson.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("lesson not found")
	}
	if err != nil {
		return nil, err
	}
	return lesson, nil
}

func (r *lessonRepositoryImpl) UpdateLesson(ctx context.Context, lesson *entities.Lesson) error {
	query := `
		UPDATE lessons
		SET status = $1, updated_at = $2
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query,
		lesson.Status, time.Now(), lesson.ID)
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

func (r *lessonRepositoryImpl) DeleteLesson(ctx context.Context, id int) error {
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

func (r *lessonRepositoryImpl) GetUpcomingLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error) {
	var query string
	if role == "student" {
		query = `
			SELECT id, student_id, tutor_id, start_time, end_time, status, language,
				price, created_at, updated_at
			FROM lessons
			WHERE student_id = $1 AND start_time > NOW() AND status = 'scheduled'
			ORDER BY start_time ASC`
	} else {
		query = `
			SELECT id, student_id, tutor_id, start_time, end_time, status, language,
				price, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND start_time > NOW() AND status = 'scheduled'
			ORDER BY start_time ASC`
	}

	return r.queryLessons(ctx, query, userID)
}

func (r *lessonRepositoryImpl) GetCompletedLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error) {
	var query string
	if role == "student" {
		query = `
			SELECT id, student_id, tutor_id, start_time, end_time, status, language,
				price, created_at, updated_at
			FROM lessons
			WHERE student_id = $1 AND status = 'completed'
			ORDER BY start_time DESC`
	} else {
		query = `
			SELECT id, student_id, tutor_id, start_time, end_time, status, language,
				price, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND status = 'completed'
			ORDER BY start_time DESC`
	}

	return r.queryLessons(ctx, query, userID)
}

func (r *lessonRepositoryImpl) GetLessonsByTimeRange(ctx context.Context, tutorID int, start, end time.Time) ([]*entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE tutor_id = $1 AND start_time BETWEEN $2 AND $3
		ORDER BY start_time ASC`

	return r.queryLessons(ctx, query, tutorID, start, end)
}

func (r *lessonRepositoryImpl) queryLessons(ctx context.Context, query string, args ...interface{}) ([]*entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []*entities.Lesson
	for rows.Next() {
		lesson := &entities.Lesson{}
		err := rows.Scan(
			&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
			&lesson.EndTime, &lesson.Status, &lesson.Language,
			&lesson.Price, &lesson.CreatedAt, &lesson.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	return lessons, nil
}

// Video session methods
func (r *lessonRepositoryImpl) CreateVideoSession(ctx context.Context, session *entities.VideoSession) error {
	query := `
		INSERT INTO video_sessions (lesson_id, room_id, session_token, started_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		session.LessonID, session.RoomID, session.SessionToken, session.StartedAt,
	).Scan(&session.ID)
}

func (r *lessonRepositoryImpl) GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error) {
	query := `
		SELECT id, lesson_id, room_id, session_token, started_at, ended_at
		FROM video_sessions
		WHERE lesson_id = $1`

	session := &entities.VideoSession{}
	err := r.db.QueryRowContext(ctx, query, lessonID).Scan(
		&session.ID, &session.LessonID, &session.RoomID,
		&session.SessionToken, &session.StartedAt, &session.EndedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("video session not found")
	}
	if err != nil {
		return nil, err
	}
	return session, nil
}

func (r *lessonRepositoryImpl) UpdateVideoSession(ctx context.Context, session *entities.VideoSession) error {
	query := `
		UPDATE video_sessions
		SET ended_at = $1
		WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query, session.EndedAt, session.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("video session not found")
	}
	return nil
}

// Chat message methods
func (r *lessonRepositoryImpl) SaveChatMessage(ctx context.Context, message *entities.ChatMessage) error {
	query := `
		INSERT INTO chat_messages (lesson_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		message.LessonID, message.SenderID, message.Content, time.Now(),
	).Scan(&message.ID)
}

func (r *lessonRepositoryImpl) GetChatHistory(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error) {
	query := `
		SELECT id, lesson_id, sender_id, content, created_at
		FROM chat_messages
		WHERE lesson_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.QueryContext(ctx, query, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []*entities.ChatMessage
	for rows.Next() {
		message := &entities.ChatMessage{}
		err := rows.Scan(
			&message.ID, &message.LessonID, &message.SenderID,
			&message.Content, &message.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}
	return messages, nil
}

// Rating methods
func (r *lessonRepositoryImpl) SaveLessonRating(ctx context.Context, rating *entities.LessonRating) error {
	query := `
		INSERT INTO lesson_ratings (lesson_id, rating, comment, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		rating.LessonID, rating.Rating, rating.Comment, time.Now(),
	).Scan(&rating.ID)
}

func (r *lessonRepositoryImpl) GetLessonRating(ctx context.Context, lessonID int) (*entities.LessonRating, error) {
	query := `
		SELECT id, lesson_id, rating, comment, created_at
		FROM lesson_ratings
		WHERE lesson_id = $1`

	rating := &entities.LessonRating{}
	err := r.db.QueryRowContext(ctx, query, lessonID).Scan(
		&rating.ID, &rating.LessonID, &rating.Rating,
		&rating.Comment, &rating.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("rating not found")
	}
	if err != nil {
		return nil, err
	}
	return rating, nil
}

func (r *lessonRepositoryImpl) GetTutorAverageRating(ctx context.Context, tutorID int) (float64, error) {
	query := `
		SELECT COALESCE(AVG(r.rating), 0)
		FROM lesson_ratings r
		JOIN lessons l ON l.id = r.lesson_id
		WHERE l.tutor_id = $1`

	var avgRating float64
	err := r.db.QueryRowContext(ctx, query, tutorID).Scan(&avgRating)
	if err != nil {
		return 0, err
	}
	return avgRating, nil
}
