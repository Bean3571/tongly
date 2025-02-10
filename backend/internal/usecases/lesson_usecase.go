package usecases

import (
	"context"
	"errors"
	"fmt"
	"time"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

type LessonUseCase interface {
	// Lesson management
	BookLesson(ctx context.Context, studentID int, request *entities.LessonBookingRequest) (*entities.Lesson, error)
	CancelLesson(ctx context.Context, userID int, lessonID int, request *entities.LessonCancellationRequest) error
	GetLessonByID(ctx context.Context, userID int, lessonID int) (*entities.Lesson, error)
	GetUpcomingLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error)
	GetCompletedLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error)

	// Video session management
	StartVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error)
	EndVideoSession(ctx context.Context, lessonID int, userID int) error
	GetVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error)

	// Chat functionality
	SendChatMessage(ctx context.Context, lessonID int, userID int, content string) error
	GetChatHistory(ctx context.Context, lessonID int, userID int) ([]*entities.ChatMessage, error)

	// Rating system
	RateLesson(ctx context.Context, lessonID int, studentID int, rating int, comment string) error
	GetTutorRating(ctx context.Context, tutorID int) (float64, error)
}

type lessonUseCase struct {
	lessonRepo repositories.LessonRepository
	tutorRepo  repositories.TutorRepository
	userRepo   repositories.UserRepository
}

func NewLessonUseCase(
	lessonRepo repositories.LessonRepository,
	tutorRepo repositories.TutorRepository,
	userRepo repositories.UserRepository,
) LessonUseCase {
	return &lessonUseCase{
		lessonRepo: lessonRepo,
		tutorRepo:  tutorRepo,
		userRepo:   userRepo,
	}
}

func (uc *lessonUseCase) BookLesson(ctx context.Context, studentID int, request *entities.LessonBookingRequest) (*entities.Lesson, error) {
	// Validate tutor exists and is available
	tutor, err := uc.tutorRepo.GetTutorByID(ctx, request.TutorID)
	if err != nil {
		return nil, err
	}
	if !tutor.Approved {
		return nil, errors.New("tutor is not approved")
	}

	// Check if the time slot is available
	endTime := request.StartTime.Add(45 * time.Minute)
	existingLessons, err := uc.lessonRepo.GetLessonsByTimeRange(ctx, request.TutorID, request.StartTime, endTime)
	if err != nil {
		return nil, err
	}
	if len(existingLessons) > 0 {
		return nil, errors.New("time slot is not available")
	}

	// Create the lesson
	lesson := &entities.Lesson{
		StudentID: studentID,
		TutorID:   request.TutorID,
		StartTime: request.StartTime,
		EndTime:   endTime,
		Status:    entities.LessonStatusScheduled,
		Language:  request.Language,
		Price:     tutor.HourlyRate,
	}

	err = uc.lessonRepo.CreateLesson(ctx, lesson)
	if err != nil {
		return nil, err
	}

	return lesson, nil
}

func (uc *lessonUseCase) CancelLesson(ctx context.Context, userID int, lessonID int, request *entities.LessonCancellationRequest) error {
	lesson, err := uc.lessonRepo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return err
	}

	// Verify user is either the student or tutor
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return errors.New("unauthorized to cancel this lesson")
	}

	// Check if lesson can be cancelled (not too close to start time)
	if time.Until(lesson.StartTime) < 24*time.Hour {
		return errors.New("cannot cancel lesson less than 24 hours before start time")
	}

	lesson.Status = entities.LessonStatusCancelled
	return uc.lessonRepo.UpdateLesson(ctx, lesson)
}

func (uc *lessonUseCase) GetLessonByID(ctx context.Context, userID int, lessonID int) (*entities.Lesson, error) {
	lesson, err := uc.lessonRepo.GetLessonByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	// Verify user is either the student or tutor
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return nil, errors.New("unauthorized to view this lesson")
	}

	return lesson, nil
}

func (uc *lessonUseCase) GetUpcomingLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error) {
	return uc.lessonRepo.GetUpcomingLessons(ctx, userID, role)
}

func (uc *lessonUseCase) GetCompletedLessons(ctx context.Context, userID int, role string) ([]*entities.Lesson, error) {
	return uc.lessonRepo.GetCompletedLessons(ctx, userID, role)
}

func (uc *lessonUseCase) StartVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}

	// Check if lesson is scheduled to start now
	now := time.Now()
	if now.Before(lesson.StartTime.Add(-5 * time.Minute)) {
		return nil, errors.New("too early to start video session")
	}
	if now.After(lesson.EndTime) {
		return nil, errors.New("lesson has ended")
	}

	// Create video session
	session := &entities.VideoSession{
		LessonID:     lessonID,
		RoomID:       generateRoomID(lessonID),
		SessionToken: generateSessionToken(),
		StartedAt:    now,
	}

	err = uc.lessonRepo.CreateVideoSession(ctx, session)
	if err != nil {
		return nil, err
	}

	// Update lesson status
	lesson.Status = entities.LessonStatusInProgress
	err = uc.lessonRepo.UpdateLesson(ctx, lesson)
	if err != nil {
		return nil, err
	}

	return session, nil
}

func (uc *lessonUseCase) EndVideoSession(ctx context.Context, lessonID int, userID int) error {
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return err
	}

	session, err := uc.lessonRepo.GetVideoSession(ctx, lessonID)
	if err != nil {
		return err
	}

	now := time.Now()
	session.EndedAt = now
	err = uc.lessonRepo.UpdateVideoSession(ctx, session)
	if err != nil {
		return err
	}

	lesson.Status = entities.LessonStatusCompleted
	return uc.lessonRepo.UpdateLesson(ctx, lesson)
}

func (uc *lessonUseCase) GetVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	// Verify user has access to the lesson
	_, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}

	return uc.lessonRepo.GetVideoSession(ctx, lessonID)
}

func (uc *lessonUseCase) SendChatMessage(ctx context.Context, lessonID int, userID int, content string) error {
	// Verify user has access to the lesson
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return err
	}

	// Only allow chat during the lesson
	now := time.Now()
	if now.Before(lesson.StartTime) || now.After(lesson.EndTime) {
		return errors.New("chat is only available during the lesson")
	}

	message := &entities.ChatMessage{
		LessonID: lessonID,
		SenderID: userID,
		Content:  content,
	}

	return uc.lessonRepo.SaveChatMessage(ctx, message)
}

func (uc *lessonUseCase) GetChatHistory(ctx context.Context, lessonID int, userID int) ([]*entities.ChatMessage, error) {
	// Verify user has access to the lesson
	_, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}

	return uc.lessonRepo.GetChatHistory(ctx, lessonID)
}

func (uc *lessonUseCase) RateLesson(ctx context.Context, lessonID int, studentID int, rating int, comment string) error {
	lesson, err := uc.GetLessonByID(ctx, studentID, lessonID)
	if err != nil {
		return err
	}

	// Verify the user is the student
	if lesson.StudentID != studentID {
		return errors.New("only students can rate lessons")
	}

	// Verify lesson is completed
	if lesson.Status != entities.LessonStatusCompleted {
		return errors.New("can only rate completed lessons")
	}

	// Verify rating is between 1 and 5
	if rating < 1 || rating > 5 {
		return errors.New("rating must be between 1 and 5")
	}

	lessonRating := &entities.LessonRating{
		LessonID: lessonID,
		Rating:   rating,
		Comment:  comment,
	}

	return uc.lessonRepo.SaveLessonRating(ctx, lessonRating)
}

func (uc *lessonUseCase) GetTutorRating(ctx context.Context, tutorID int) (float64, error) {
	return uc.lessonRepo.GetTutorAverageRating(ctx, tutorID)
}

// Helper functions
func generateRoomID(lessonID int) string {
	return fmt.Sprintf("lesson_%d_%d", lessonID, time.Now().Unix())
}

func generateSessionToken() string {
	// In a real implementation, this would generate a secure token
	return fmt.Sprintf("session_%d", time.Now().Unix())
}
