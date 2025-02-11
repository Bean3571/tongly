package usecases

import (
	"context"
	"errors"
	"time"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

type VideoUseCaseImpl struct {
	lessonRepo repositories.LessonRepository
}

func NewVideoUseCase(lessonRepo repositories.LessonRepository) VideoUseCase {
	return &VideoUseCaseImpl{
		lessonRepo: lessonRepo,
	}
}

func (u *VideoUseCaseImpl) GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error) {
	// Get the video session for the lesson
	session, err := u.lessonRepo.GetVideoSession(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	return session, nil
}

var (
	ErrUnauthorized = errors.New("unauthorized")
)

// StartVideoSession creates a new video session for a lesson
func (u *VideoUseCaseImpl) StartVideoSession(ctx context.Context, lessonID int, session *entities.VideoSession) error {
	// Get the lesson
	lesson, err := u.lessonRepo.GetLesson(ctx, lessonID)
	if err != nil {
		return err
	}

	// Check if lesson can be joined
	now := time.Now()
	startTime := lesson.StartTime
	endTime := lesson.EndTime
	joinWindow := startTime.Add(-5 * time.Minute)

	if now.Before(joinWindow) {
		return errors.New("too early to join lesson")
	}

	if now.After(endTime) {
		return errors.New("lesson has ended")
	}

	// Allow joining if lesson is scheduled or in progress
	if lesson.Status != entities.LessonStatusScheduled && lesson.Status != entities.LessonStatusInProgress {
		return errors.New("invalid lesson status")
	}

	// Update lesson status to in_progress if it's scheduled
	if lesson.Status == entities.LessonStatusScheduled {
		lesson.Status = entities.LessonStatusInProgress
		if err := u.lessonRepo.UpdateLesson(ctx, lesson); err != nil {
			return err
		}
	}

	// Set session start time
	session.StartedAt = now

	// Create video session
	return u.lessonRepo.CreateVideoSession(ctx, session)
}

func (u *VideoUseCaseImpl) EndVideoSession(ctx context.Context, lessonID int) error {
	// Get the lesson
	lesson, err := u.lessonRepo.GetLesson(ctx, lessonID)
	if err != nil {
		return err
	}

	// Check if lesson can be ended
	if lesson.Status != entities.LessonStatusInProgress {
		return errors.New("lesson must be in progress to end")
	}

	// Update lesson status to completed
	lesson.Status = entities.LessonStatusCompleted
	if err := u.lessonRepo.UpdateLesson(ctx, lesson); err != nil {
		return err
	}

	return nil
}
