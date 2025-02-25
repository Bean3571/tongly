package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

type videoSessionRepositoryImpl struct {
	db *sql.DB
}

func NewVideoSessionRepository(db *sql.DB) VideoSessionRepository {
	return &videoSessionRepositoryImpl{
		db: db,
	}
}

func (r *videoSessionRepositoryImpl) Create(ctx context.Context, session *entities.VideoSession) error {
	query := `
		INSERT INTO video_sessions (lesson_id, room_id, session_token, started_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		session.LessonID, session.RoomID, session.Token, session.StartTime,
	).Scan(&session.ID)
}

func (r *videoSessionRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.VideoSession, error) {
	query := `
		SELECT id, lesson_id, room_id, session_token, started_at, ended_at
		FROM video_sessions
		WHERE id = $1`

	session := &entities.VideoSession{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&session.ID, &session.LessonID, &session.RoomID, &session.Token,
		&session.StartTime, &session.EndTime,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return session, err
}

func (r *videoSessionRepositoryImpl) Update(ctx context.Context, session *entities.VideoSession) error {
	query := `
		UPDATE video_sessions
		SET ended_at = $1
		WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query,
		session.EndTime, session.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *videoSessionRepositoryImpl) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM video_sessions WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *videoSessionRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.VideoSession, error) {
	// Implement if needed
	return nil, nil
}

func (r *videoSessionRepositoryImpl) GetByLessonID(ctx context.Context, lessonID int) (*entities.VideoSession, error) {
	query := `
		SELECT id, lesson_id, room_id, session_token, started_at, ended_at
		FROM video_sessions
		WHERE lesson_id = $1
		ORDER BY created_at DESC
		LIMIT 1`

	session := &entities.VideoSession{}
	err := r.db.QueryRowContext(ctx, query, lessonID).Scan(
		&session.ID, &session.LessonID, &session.RoomID, &session.Token,
		&session.StartTime, &session.EndTime,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return session, err
}

func (r *videoSessionRepositoryImpl) GetActiveByTutorID(ctx context.Context, tutorID int) ([]entities.VideoSession, error) {
	query := `
		SELECT vs.id, vs.lesson_id, vs.room_id, vs.session_token, vs.started_at, vs.ended_at
		FROM video_sessions vs
		JOIN lessons l ON vs.lesson_id = l.id
		WHERE l.tutor_id = $1 AND vs.ended_at IS NULL`

	rows, err := r.db.QueryContext(ctx, query, tutorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []entities.VideoSession
	for rows.Next() {
		var session entities.VideoSession
		err := rows.Scan(
			&session.ID, &session.LessonID, &session.RoomID, &session.Token,
			&session.StartTime, &session.EndTime,
		)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, session)
	}
	return sessions, nil
}
