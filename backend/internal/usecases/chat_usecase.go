package usecases

import (
	"context"
	"time"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
	"tongly-backend/internal/services"
)

// ChatUseCase handles chat related operations
type ChatUseCase interface {
	SendMessage(ctx context.Context, lessonID int, userID int, content string) error
	GetHistory(ctx context.Context, lessonID int, userID int) ([]*entities.ChatMessage, error)
}

type chatUseCase struct {
	lessonRepo   repositories.LessonRepository
	chatRepo     repositories.ChatRepository
	errorService *services.ErrorService
}

func NewChatUseCase(
	lessonRepo repositories.LessonRepository,
	chatRepo repositories.ChatRepository,
	errorService *services.ErrorService,
) ChatUseCase {
	return &chatUseCase{
		lessonRepo:   lessonRepo,
		chatRepo:     chatRepo,
		errorService: errorService,
	}
}

func (uc *chatUseCase) SendMessage(ctx context.Context, lessonID int, userID int, content string) error {
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return uc.errorService.WrapError(err, "failed to get lesson")
	}

	if !uc.canAccessChat(lesson, userID) {
		return services.ErrUnauthorized
	}

	message := &entities.ChatMessage{
		LessonID:  lessonID,
		SenderID:  userID,
		Content:   content,
		CreatedAt: time.Now(),
	}

	return uc.chatRepo.Create(ctx, message)
}

func (uc *chatUseCase) GetHistory(ctx context.Context, lessonID int, userID int) ([]*entities.ChatMessage, error) {
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, uc.errorService.WrapError(err, "failed to get lesson")
	}

	if !uc.canAccessChat(lesson, userID) {
		return nil, services.ErrUnauthorized
	}

	return uc.chatRepo.GetByLessonID(ctx, lessonID)
}

func (uc *chatUseCase) canAccessChat(lesson *entities.Lesson, userID int) bool {
	return lesson.TutorID == userID || lesson.StudentID == userID
}
