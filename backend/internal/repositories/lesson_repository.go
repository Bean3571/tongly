package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
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
		(student_id, tutor_id, language_id, start_time, end_time, notes, 
		 session_id, join_token_student, join_token_tutor)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
		lesson.SessionID,
		lesson.JoinTokenStudent,
		lesson.JoinTokenTutor,
	).Scan(&lesson.ID, &lesson.CreatedAt, &lesson.UpdatedAt)

	return err
}

// GetByID retrieves a lesson by ID
func (r *LessonRepository) GetByID(ctx context.Context, id int) (*entities.Lesson, error) {
	query := `
		SELECT 
			l.id, l.student_id, l.tutor_id, l.language_id, l.start_time, l.end_time,
			l.cancelled_by, l.cancelled_at, l.notes, l.created_at, l.updated_at,
			l.session_id, l.join_token_student, l.join_token_tutor,
			s.username as student_username, s.email as student_email, 
			s.first_name as student_first_name, s.last_name as student_last_name,
			s.profile_picture_url as student_profile_picture_url, s.role as student_role,
			t.username as tutor_username, t.email as tutor_email, 
			t.first_name as tutor_first_name, t.last_name as tutor_last_name,
			t.profile_picture_url as tutor_profile_picture_url, t.role as tutor_role,
			lang.name as language_name
		FROM lessons l
		JOIN users s ON l.student_id = s.id
		JOIN users t ON l.tutor_id = t.id
		JOIN languages lang ON l.language_id = lang.id
		WHERE l.id = $1
	`

	var lesson entities.Lesson
	var student entities.User
	var tutor entities.User
	var language entities.Language
	var cancelledBy sql.NullInt64
	var cancelledAt sql.NullTime
	var notes sql.NullString
	var sessionID sql.NullString
	var joinTokenStudent sql.NullString
	var joinTokenTutor sql.NullString
	var studentProfilePictureURL sql.NullString
	var tutorProfilePictureURL sql.NullString

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&lesson.ID, &lesson.StudentID, &lesson.TutorID, &lesson.LanguageID,
		&lesson.StartTime, &lesson.EndTime, &cancelledBy, &cancelledAt, &notes,
		&lesson.CreatedAt, &lesson.UpdatedAt, &sessionID, &joinTokenStudent, &joinTokenTutor,
		&student.Username, &student.Email, &student.FirstName, &student.LastName,
		&studentProfilePictureURL, &student.Role,
		&tutor.Username, &tutor.Email, &tutor.FirstName, &tutor.LastName,
		&tutorProfilePictureURL, &tutor.Role,
		&language.Name,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, entities.ErrNotFound
		}
		return nil, err
	}

	if cancelledBy.Valid {
		intValue := int(cancelledBy.Int64)
		lesson.CancelledBy = &intValue
	}

	if cancelledAt.Valid {
		lesson.CancelledAt = &cancelledAt.Time
	}

	if notes.Valid {
		lesson.Notes = &notes.String
	}

	if sessionID.Valid {
		lesson.SessionID = &sessionID.String
	}

	if joinTokenStudent.Valid {
		lesson.JoinTokenStudent = &joinTokenStudent.String
	}

	if joinTokenTutor.Valid {
		lesson.JoinTokenTutor = &joinTokenTutor.String
	}

	if studentProfilePictureURL.Valid {
		student.ProfilePictureURL = &studentProfilePictureURL.String
	}

	if tutorProfilePictureURL.Valid {
		tutor.ProfilePictureURL = &tutorProfilePictureURL.String
	}

	student.ID = lesson.StudentID
	tutor.ID = lesson.TutorID
	language.ID = lesson.LanguageID

	lesson.Student = &student
	lesson.Tutor = &tutor
	lesson.Language = &language

	return &lesson, nil
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
			WHERE student_id = $1 AND end_time >= NOW() AND cancelled_by IS NULL
			ORDER BY start_time ASC
		`
	} else {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND end_time >= NOW() AND cancelled_by IS NULL
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
			WHERE student_id = $1 AND end_time < NOW() AND cancelled_by IS NULL
			ORDER BY start_time DESC
		`
	} else {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND end_time < NOW() AND cancelled_by IS NULL
			ORDER BY start_time DESC
		`
	}

	return r.getLessonsByQuery(ctx, query, userID)
}

// GetCancelledLessons retrieves cancelled lessons for a user (either student or tutor)
func (r *LessonRepository) GetCancelledLessons(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	var query string
	if isStudent {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE student_id = $1 AND cancelled_by IS NOT NULL
			ORDER BY start_time DESC
		`
	} else {
		query = `
			SELECT id, student_id, tutor_id, language_id, start_time, end_time, 
				   cancelled_by, cancelled_at, notes, created_at, updated_at
			FROM lessons
			WHERE tutor_id = $1 AND cancelled_by IS NOT NULL
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

// UpdateLessonVideoSession updates the video session information for a lesson
func (r *LessonRepository) UpdateLessonVideoSession(lessonID int, sessionID, studentToken, tutorToken string) error {
	query := `
		UPDATE lessons
		SET 
			session_id = $2,
			join_token_student = $3,
			join_token_tutor = $4,
			updated_at = NOW()
		WHERE id = $1
	`

	result, err := r.db.Exec(query, lessonID, sessionID, studentToken, tutorToken)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return entities.ErrNotFound
	}

	return nil
}

// LogVideoCallEvent logs a video call event in the database
func (r *LessonRepository) LogVideoCallEvent(event *entities.VideoCallEvent) error {
	query := `
		INSERT INTO video_call_events (
			lesson_id, user_id, event_type, event_data, created_at
		)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, created_at
	`

	eventDataJSON, err := json.Marshal(event.EventData)
	if err != nil {
		return err
	}

	return r.db.QueryRow(
		query,
		event.LessonID,
		event.UserID,
		event.EventType,
		eventDataJSON,
	).Scan(&event.ID, &event.CreatedAt)
}
