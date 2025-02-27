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
	GetLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	UpdateLessonStatus(ctx context.Context, lesson *entities.Lesson) error
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

func (uc *lessonUseCase) GetLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetLessons(ctx, userID)
}

func (uc *lessonUseCase) UpdateLessonStatus(ctx context.Context, lesson *entities.Lesson) error {
	return uc.lessonRepo.UpdateLesson(ctx, lesson)
}

// Helper functions
func generateRoomID(lessonID int) string {
	return fmt.Sprintf("lesson_%d_%d", lessonID, time.Now().Unix())
}

func generateSessionToken() string {
	// In a real implementation, this would generate a secure token
	return fmt.Sprintf("session_%d", time.Now().Unix())
}
