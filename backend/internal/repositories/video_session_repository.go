package repositories

import (
	"context"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

// VideoSessionRepository defines the interface for video session persistence operations
type VideoSessionRepository interface {
	common.Repository[entities.VideoSession]
	GetByLessonID(ctx context.Context, lessonID int) (*entities.VideoSession, error)
	GetActiveByTutorID(ctx context.Context, tutorID int) ([]entities.VideoSession, error)
	AddParticipant(ctx context.Context, lessonID int, userID int) error
	RemoveParticipant(ctx context.Context, lessonID int, userID int) error
	GetParticipants(ctx context.Context, lessonID int) ([]entities.RoomParticipant, error)
}
