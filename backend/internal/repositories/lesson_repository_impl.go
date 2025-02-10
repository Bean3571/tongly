package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

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
				student_id, tutor_id, start_time, end_time, status, language, 
				price, duration, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id, created_at, updated_at`

		err := tx.QueryRowContext(ctx, query,
			lesson.StudentID, lesson.TutorID, lesson.StartTime, lesson.EndTime,
			lesson.Status, lesson.Language, lesson.Price,
			lesson.Duration, // Use the duration from the lesson directly
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

func (r *LessonRepositoryImpl) GetLesson(ctx context.Context, id uint) (*entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, duration, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE id = $1`

	lesson := &entities.Lesson{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
		&lesson.EndTime, &lesson.Duration, &lesson.Status, &lesson.Language,
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

func (r *LessonRepositoryImpl) UpdateLesson(ctx context.Context, lesson *entities.Lesson) error {
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

func (r *LessonRepositoryImpl) GetUpcomingLessons(ctx context.Context, userID uint) ([]entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, duration, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE (student_id = $1 OR tutor_id = $1) 
			AND start_time > NOW() 
			AND status != 'cancelled'
		ORDER BY start_time ASC`

	return r.queryLessons(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetCompletedLessons(ctx context.Context, userID uint) ([]entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, duration, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE (student_id = $1 OR tutor_id = $1) 
			AND end_time < NOW()
		ORDER BY start_time DESC`

	return r.queryLessons(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetLessonsByTutor(ctx context.Context, tutorID uint) ([]entities.Lesson, error) {
	query := `
		SELECT id, student_id, tutor_id, start_time, end_time, duration, status, language,
			price, created_at, updated_at
		FROM lessons
		WHERE tutor_id = $1
		ORDER BY start_time ASC`

	return r.queryLessons(ctx, query, tutorID)
}

func (r *LessonRepositoryImpl) queryLessons(ctx context.Context, query string, args ...interface{}) ([]entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []entities.Lesson
	for rows.Next() {
		var lesson entities.Lesson
		err := rows.Scan(
			&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
			&lesson.EndTime, &lesson.Duration, &lesson.Status, &lesson.Language,
			&lesson.Price, &lesson.CreatedAt, &lesson.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		lessons = append(lessons, lesson)
	}
	return lessons, nil
}

func (r *LessonRepositoryImpl) CreateVideoSession(ctx context.Context, session *entities.VideoSession) error {
	query := `
		INSERT INTO video_sessions (lesson_id, room_id, session_token, started_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, query,
		session.LessonID, session.RoomID, session.SessionToken, session.StartedAt,
	).Scan(&session.ID)

	if err != nil {
		return fmt.Errorf("failed to create video session: %v", err)
	}

	return nil
}

func (r *LessonRepositoryImpl) StartVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error {
	return r.withTx(ctx, func(tx *sql.Tx) error {
		// Update lesson status
		statusQuery := `
			UPDATE lessons 
			SET status = $1, updated_at = $2
			WHERE id = $3`

		result, err := tx.ExecContext(ctx, statusQuery,
			entities.LessonStatusInProgress, time.Now(), lesson.ID)
		if err != nil {
			return fmt.Errorf("failed to update lesson status: %v", err)
		}

		rows, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get affected rows: %v", err)
		}
		if rows == 0 {
			return errors.New("lesson not found")
		}

		// Create video session
		sessionQuery := `
			INSERT INTO video_sessions (lesson_id, room_id, session_token, started_at)
			VALUES ($1, $2, $3, $4)
			RETURNING id`

		err = tx.QueryRowContext(ctx, sessionQuery,
			session.LessonID, session.RoomID, session.SessionToken, session.StartedAt,
		).Scan(&session.ID)

		if err != nil {
			return fmt.Errorf("failed to create video session: %v", err)
		}

		return nil
	})
}

func (r *LessonRepositoryImpl) EndVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error {
	return r.withTx(ctx, func(tx *sql.Tx) error {
		// Update video session
		sessionQuery := `
			UPDATE video_sessions
			SET ended_at = $1
			WHERE id = $2`

		result, err := tx.ExecContext(ctx, sessionQuery, session.EndedAt, session.ID)
		if err != nil {
			return fmt.Errorf("failed to update video session: %v", err)
		}

		rows, err := result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get affected rows: %v", err)
		}
		if rows == 0 {
			return errors.New("video session not found")
		}

		// Update lesson status
		lessonQuery := `
			UPDATE lessons
			SET status = $1, updated_at = $2
			WHERE id = $3`

		result, err = tx.ExecContext(ctx, lessonQuery,
			entities.LessonStatusCompleted, time.Now(), lesson.ID)
		if err != nil {
			return fmt.Errorf("failed to update lesson status: %v", err)
		}

		rows, err = result.RowsAffected()
		if err != nil {
			return fmt.Errorf("failed to get affected rows: %v", err)
		}
		if rows == 0 {
			return errors.New("lesson not found")
		}

		return nil
	})
}

func (r *LessonRepositoryImpl) GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error) {
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

func (r *LessonRepositoryImpl) UpdateVideoSession(ctx context.Context, session *entities.VideoSession) error {
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

func (r *LessonRepositoryImpl) SaveChatMessage(ctx context.Context, message *entities.ChatMessage) error {
	query := `
		INSERT INTO chat_messages (lesson_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		message.LessonID, message.SenderID, message.Content, time.Now(),
	).Scan(&message.ID)
}

func (r *LessonRepositoryImpl) GetChatHistory(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error) {
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

func (r *LessonRepositoryImpl) SaveLessonRating(ctx context.Context, rating *entities.LessonRating) error {
	query := `
		INSERT INTO lesson_ratings (lesson_id, rating, comment, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		rating.LessonID, rating.Rating, rating.Comment, time.Now(),
	).Scan(&rating.ID)
}

func (r *LessonRepositoryImpl) GetLessonRating(ctx context.Context, lessonID int) (*entities.LessonRating, error) {
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

func (r *LessonRepositoryImpl) GetTutorAverageRating(ctx context.Context, tutorID int) (float64, error) {
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
