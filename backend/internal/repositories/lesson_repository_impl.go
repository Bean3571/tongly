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

func (r *LessonRepositoryImpl) GetLesson(ctx context.Context, id int) (*entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.status, l.language, l.price, l.created_at, l.updated_at,
			sp.first_name as student_first_name, sp.last_name as student_last_name,
			tp.first_name as tutor_first_name, tp.last_name as tutor_last_name
		FROM lessons l
		LEFT JOIN user_credentials sc ON l.student_id = sc.id
		LEFT JOIN user_personal sp ON sc.id = sp.user_id
		LEFT JOIN user_credentials tc ON l.tutor_id = tc.id
		LEFT JOIN user_personal tp ON tc.id = tp.user_id
		WHERE l.id = $1`

	lesson := &entities.Lesson{}
	var studentFirstName, studentLastName, tutorFirstName, tutorLastName sql.NullString
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
		&lesson.EndTime, &lesson.Duration, &lesson.Status, &lesson.Language,
		&lesson.Price, &lesson.CreatedAt, &lesson.UpdatedAt,
		&studentFirstName, &studentLastName,
		&tutorFirstName, &tutorLastName,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("lesson not found")
	}
	if err != nil {
		return nil, err
	}

	// Set the names in the lesson struct
	if studentFirstName.Valid && studentLastName.Valid {
		lesson.StudentName = studentFirstName.String + " " + studentLastName.String
	}
	if tutorFirstName.Valid && tutorLastName.Valid {
		lesson.TutorName = tutorFirstName.String + " " + tutorLastName.String
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

func (r *LessonRepositoryImpl) GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.status, l.language, l.price, l.created_at, l.updated_at,
			sp.first_name as student_first_name, sp.last_name as student_last_name,
			tp.first_name as tutor_first_name, tp.last_name as tutor_last_name
		FROM lessons l
		LEFT JOIN user_credentials sc ON l.student_id = sc.id
		LEFT JOIN user_personal sp ON sc.id = sp.user_id
		LEFT JOIN user_credentials tc ON l.tutor_id = tc.id
		LEFT JOIN user_personal tp ON tc.id = tp.user_id
		WHERE (l.student_id = $1 OR l.tutor_id = $1) 
			AND (
				(l.start_time > NOW() AND l.status = 'scheduled')
				OR l.status = 'in_progress'
			)
			AND l.status != 'cancelled'
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithNames(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.status, l.language, l.price, l.created_at, l.updated_at,
			sp.first_name as student_first_name, sp.last_name as student_last_name,
			tp.first_name as tutor_first_name, tp.last_name as tutor_last_name
		FROM lessons l
		LEFT JOIN user_credentials sc ON l.student_id = sc.id
		LEFT JOIN user_personal sp ON sc.id = sp.user_id
		LEFT JOIN user_credentials tc ON l.tutor_id = tc.id
		LEFT JOIN user_personal tp ON tc.id = tp.user_id
		WHERE (l.student_id = $1 OR l.tutor_id = $1) 
			AND l.status = 'completed'
		ORDER BY l.start_time DESC`

	return r.queryLessonsWithNames(ctx, query, userID)
}

func (r *LessonRepositoryImpl) GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.start_time, l.end_time, 
			l.duration, l.status, l.language, l.price, l.created_at, l.updated_at,
			sp.first_name as student_first_name, sp.last_name as student_last_name,
			tp.first_name as tutor_first_name, tp.last_name as tutor_last_name
		FROM lessons l
		LEFT JOIN user_credentials sc ON l.student_id = sc.id
		LEFT JOIN user_personal sp ON sc.id = sp.user_id
		LEFT JOIN user_credentials tc ON l.tutor_id = tc.id
		LEFT JOIN user_personal tp ON tc.id = tp.user_id
		WHERE l.tutor_id = $1
		ORDER BY l.start_time ASC`

	return r.queryLessonsWithNames(ctx, query, tutorID)
}

func (r *LessonRepositoryImpl) queryLessonsWithNames(ctx context.Context, query string, args ...interface{}) ([]entities.Lesson, error) {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var lessons []entities.Lesson
	for rows.Next() {
		var lesson entities.Lesson
		var studentFirstName, studentLastName, tutorFirstName, tutorLastName sql.NullString
		err := rows.Scan(
			&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.StartTime,
			&lesson.EndTime, &lesson.Duration, &lesson.Status, &lesson.Language,
			&lesson.Price, &lesson.CreatedAt, &lesson.UpdatedAt,
			&studentFirstName, &studentLastName,
			&tutorFirstName, &tutorLastName,
		)
		if err != nil {
			return nil, err
		}

		// Set the names in the lesson struct
		if studentFirstName.Valid && studentLastName.Valid {
			lesson.StudentName = studentFirstName.String + " " + studentLastName.String
		}
		if tutorFirstName.Valid && tutorLastName.Valid {
			lesson.TutorName = tutorFirstName.String + " " + tutorLastName.String
		}

		lessons = append(lessons, lesson)
	}
	return lessons, nil
}

func (r *LessonRepositoryImpl) CreateVideoSession(ctx context.Context, session *entities.VideoSession) error {
	query := `
		INSERT INTO video_sessions (lesson_id, room_id, token, start_time)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	err := r.db.QueryRowContext(ctx, query,
		session.LessonID, session.RoomID, session.Token, session.StartTime,
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
			INSERT INTO video_sessions (lesson_id, room_id, token, start_time)
			VALUES ($1, $2, $3, $4)
			RETURNING id`

		err = tx.QueryRowContext(ctx, sessionQuery,
			session.LessonID, session.RoomID, session.Token, session.StartTime,
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
			SET end_time = $1
			WHERE id = $2`

		result, err := tx.ExecContext(ctx, sessionQuery, session.EndTime, session.ID)
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
		SELECT id, lesson_id, room_id, token, start_time, end_time, status
		FROM video_sessions
		WHERE lesson_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	session := &entities.VideoSession{}
	err := r.db.QueryRowContext(ctx, query, lessonID).Scan(
		&session.ID, &session.LessonID, &session.RoomID, &session.Token,
		&session.StartTime, &session.EndTime, &session.Status,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("video session not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get video session: %v", err)
	}
	return session, nil
}

func (r *LessonRepositoryImpl) UpdateVideoSession(ctx context.Context, session *entities.VideoSession) error {
	query := `
		UPDATE video_sessions
		SET end_time = $1, updated_at = $2
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query,
		session.EndTime, time.Now(), session.ID)
	if err != nil {
		return fmt.Errorf("failed to update video session: %v", err)
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
			l.duration, l.status, l.language, l.price, l.created_at, l.updated_at,
			sp.first_name as student_first_name, sp.last_name as student_last_name,
			tp.first_name as tutor_first_name, tp.last_name as tutor_last_name
		FROM lessons l
		LEFT JOIN user_credentials sc ON l.student_id = sc.id
		LEFT JOIN user_personal sp ON sc.id = sp.user_id
		LEFT JOIN user_credentials tc ON l.tutor_id = tc.id
		LEFT JOIN user_personal tp ON tc.id = tp.user_id
		WHERE l.student_id = $1
		ORDER BY l.start_time DESC`

	return r.queryLessonsWithNames(ctx, query, studentID)
}

func (r *LessonRepositoryImpl) GetCompletedByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return r.GetCompletedLessons(ctx, userID)
}

func (r *LessonRepositoryImpl) GetUpcomingByUserID(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return r.GetUpcomingLessons(ctx, userID)
}
