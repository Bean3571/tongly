package usecases

import (
	"context"
	"fmt"
	"time"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
	"tongly-backend/internal/services"
)

// VideoSessionUseCase handles video session related operations
type VideoSessionUseCase interface {
	StartSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error)
	EndSession(ctx context.Context, lessonID int, userID int) error
	GetSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error)
	GetActiveSessionsByTutor(ctx context.Context, tutorID int) ([]entities.VideoSession, error)
}

type videoSessionUseCase struct {
	lessonRepo       repositories.LessonRepository
	videoSessionRepo repositories.VideoSessionRepository
	errorService     *services.ErrorService
}

func NewVideoSessionUseCase(
	lessonRepo repositories.LessonRepository,
	videoSessionRepo repositories.VideoSessionRepository,
	errorService *services.ErrorService,
) VideoSessionUseCase {
	return &videoSessionUseCase{
		lessonRepo:       lessonRepo,
		videoSessionRepo: videoSessionRepo,
		errorService:     errorService,
	}
}

func (uc *videoSessionUseCase) StartSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, uc.errorService.WrapError(err, "failed to get lesson")
	}

	if !uc.canStartSession(lesson, userID) {
		return nil, services.ErrUnauthorized
	}

	session := &entities.VideoSession{
		LessonID:  lessonID,
		RoomID:    fmt.Sprintf("lesson_%d_%d", lessonID, time.Now().Unix()),
		Token:     fmt.Sprintf("session_%d", time.Now().Unix()),
		StartTime: time.Now(),
	}

	if err := uc.videoSessionRepo.Create(ctx, session); err != nil {
		return nil, uc.errorService.WrapError(err, "failed to create video session")
	}

	return session, nil
}

func (uc *videoSessionUseCase) EndSession(ctx context.Context, lessonID int, userID int) error {
	session, err := uc.GetSession(ctx, lessonID, userID)
	if err != nil {
		return err
	}

	session.EndTime = time.Now()

	return uc.videoSessionRepo.Update(ctx, session)
}

func (uc *videoSessionUseCase) GetSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	session, err := uc.videoSessionRepo.GetByLessonID(ctx, lessonID)
	if err != nil {
		return nil, uc.errorService.WrapError(err, "failed to get video session")
	}

	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, uc.errorService.WrapError(err, "failed to get lesson")
	}

	if !uc.canAccessSession(lesson, userID) {
		return nil, services.ErrUnauthorized
	}

	return session, nil
}

func (uc *videoSessionUseCase) GetActiveSessionsByTutor(ctx context.Context, tutorID int) ([]entities.VideoSession, error) {
	return uc.videoSessionRepo.GetActiveByTutorID(ctx, tutorID)
}

func (uc *videoSessionUseCase) canStartSession(lesson *entities.Lesson, userID int) bool {
	return lesson.TutorID == userID || lesson.StudentID == userID
}

func (uc *videoSessionUseCase) canAccessSession(lesson *entities.Lesson, userID int) bool {
	return lesson.TutorID == userID || lesson.StudentID == userID
}
