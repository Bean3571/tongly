package repositories

import (
	"context"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

// ChatRepository defines the interface for chat message persistence operations
type ChatRepository interface {
	common.Repository[entities.ChatMessage]
	GetByLessonID(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error)
}
