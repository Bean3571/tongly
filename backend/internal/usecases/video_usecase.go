package usecases

import (
	"context"
	"tongly-backend/internal/entities"
)

type VideoUseCase interface {
	GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error)
	StartVideoSession(ctx context.Context, lessonID int, session *entities.VideoSession) error
	EndVideoSession(ctx context.Context, lessonID int) error
}
