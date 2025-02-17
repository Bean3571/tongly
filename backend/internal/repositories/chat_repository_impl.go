package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

type chatRepositoryImpl struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepositoryImpl{
		db: db,
	}
}

func (r *chatRepositoryImpl) Create(ctx context.Context, message *entities.ChatMessage) error {
	query := `
		INSERT INTO chat_messages (lesson_id, sender_id, content, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		message.LessonID, message.SenderID, message.Content, message.CreatedAt,
	).Scan(&message.ID)
}

func (r *chatRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.ChatMessage, error) {
	query := `
		SELECT id, lesson_id, sender_id, content, created_at
		FROM chat_messages
		WHERE id = $1`

	message := &entities.ChatMessage{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&message.ID, &message.LessonID, &message.SenderID,
		&message.Content, &message.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return message, err
}

func (r *chatRepositoryImpl) Update(ctx context.Context, message *entities.ChatMessage) error {
	query := `
		UPDATE chat_messages
		SET content = $1
		WHERE id = $2`

	result, err := r.db.ExecContext(ctx, query, message.Content, message.ID)
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

func (r *chatRepositoryImpl) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM chat_messages WHERE id = $1`
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

func (r *chatRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.ChatMessage, error) {
	// Implement if needed
	return nil, nil
}

func (r *chatRepositoryImpl) GetByLessonID(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error) {
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
