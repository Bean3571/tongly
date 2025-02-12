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
	GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error)

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
	// Validate request
	if err := request.Validate(); err != nil {
		return nil, err
	}

	// Validate tutor exists and check approval status
	tutor, err := uc.tutorRepo.GetTutorByID(ctx, request.TutorID)
	if err != nil {
		return nil, err
	}

	// Check if the time slot is available
	endTime := request.StartTime.Add(time.Duration(request.Duration) * time.Minute)
	existingLessons, err := uc.lessonRepo.GetLessonsByTutor(ctx, request.TutorID)
	if err != nil {
		return nil, err
	}

	// Check for time slot conflicts
	for _, lesson := range existingLessons {
		if (request.StartTime.Before(lesson.EndTime) && endTime.After(lesson.StartTime)) ||
			(request.StartTime.Equal(lesson.StartTime) && endTime.Equal(lesson.EndTime)) {
			return nil, errors.New("time slot is not available")
		}
	}

	// Calculate price based on duration
	hourlyRate := tutor.HourlyRate
	if hourlyRate <= 0 {
		hourlyRate = 25.0 // Default hourly rate if not set
	}
	price := hourlyRate * float64(request.Duration) / 60.0

	// Create the lesson
	lesson := &entities.Lesson{
		StudentID: studentID,
		TutorID:   request.TutorID,
		StartTime: request.StartTime,
		EndTime:   endTime,
		Duration:  request.Duration,
		Status:    entities.LessonStatusScheduled,
		Language:  request.Language,
		Price:     price,
	}

	err = uc.lessonRepo.CreateLesson(ctx, lesson)
	if err != nil {
		return nil, err
	}

	// If tutor is not approved, return a specific error type that includes the lesson
	if !tutor.Approved {
		return lesson, &entities.TutorNotApprovedError{
			Message: "Lesson booked successfully, but tutor is not yet approved. The lesson will be pending until tutor approval.",
			Lesson:  lesson,
		}
	}

	return lesson, nil
}

func (uc *lessonUseCase) CancelLesson(ctx context.Context, userID int, lessonID int, request *entities.LessonCancellationRequest) error {
	// Validate request
	if err := request.Validate(); err != nil {
		return err
	}

	lesson, err := uc.lessonRepo.GetLesson(ctx, lessonID)
	if err != nil {
		return err
	}

	// Verify user is either the student or tutor
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return errors.New("unauthorized to cancel this lesson")
	}

	// Check if lesson can be cancelled
	if err := lesson.CanCancel(); err != nil {
		return err
	}

	lesson.Status = entities.LessonStatusCancelled
	return uc.lessonRepo.UpdateLesson(ctx, lesson)
}

func (uc *lessonUseCase) GetLessonByID(ctx context.Context, userID int, lessonID int) (*entities.Lesson, error) {
	lesson, err := uc.lessonRepo.GetLesson(ctx, lessonID)
	if err != nil {
		return nil, err
	}

	// Verify user is either the student or tutor
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return nil, errors.New("unauthorized to view this lesson")
	}

	return lesson, nil
}

func (uc *lessonUseCase) GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetUpcomingLessons(ctx, userID)
}

func (uc *lessonUseCase) GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetCompletedLessons(ctx, userID)
}

func (uc *lessonUseCase) StartVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}

	// Check if lesson can be started
	if err := lesson.CanStart(); err != nil {
		return nil, err
	}

	// Check for existing session
	existingSession, err := uc.lessonRepo.GetVideoSession(ctx, lessonID)
	if err == nil && existingSession != nil {
		return existingSession, nil
	}

	// Create video session
	session := &entities.VideoSession{
		LessonID:     lessonID,
		RoomID:       generateRoomID(lessonID),
		SessionToken: generateSessionToken(),
		StartedAt:    time.Now(),
	}

	// Start video session with transaction
	err = uc.lessonRepo.StartVideoSession(ctx, lesson, session)
	if err != nil {
		return nil, fmt.Errorf("failed to start video session: %v", err)
	}

	return session, nil
}

func (uc *lessonUseCase) EndVideoSession(ctx context.Context, lessonID int, userID int) error {
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return err
	}

	// Check if lesson can be ended
	if err := lesson.CanEnd(); err != nil {
		return err
	}

	session, err := uc.lessonRepo.GetVideoSession(ctx, lessonID)
	if err != nil {
		return err
	}

	session.EndedAt = time.Now()

	// End video session with transaction
	err = uc.lessonRepo.EndVideoSession(ctx, lesson, session)
	if err != nil {
		return fmt.Errorf("failed to end video session: %v", err)
	}

	return nil
}

func (uc *lessonUseCase) GetVideoSession(ctx context.Context, lessonID int, userID int) (*entities.VideoSession, error) {
	// Verify user has access to the lesson
	_, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return nil, err
	}

	session, err := uc.lessonRepo.GetVideoSession(ctx, lessonID)
	if err != nil {
		// Create a new session if one doesn't exist
		return uc.StartVideoSession(ctx, lessonID, userID)
	}

	return session, nil
}

func (uc *lessonUseCase) SendChatMessage(ctx context.Context, lessonID int, userID int, content string) error {
	// Verify user has access to the lesson
	lesson, err := uc.GetLessonByID(ctx, userID, lessonID)
	if err != nil {
		return err
	}

	// Only allow chat when lesson is in progress
	if lesson.Status != entities.LessonStatusInProgress {
		return errors.New("chat is only available during in-progress lessons")
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
