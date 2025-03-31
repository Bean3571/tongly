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
	GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
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
	tutorProfile, err := uc.tutorRepo.GetTutorByID(ctx, request.TutorID)
	if err != nil {
		return nil, err
	}

	// Check if the time slot is available
	existingLessons, err := uc.lessonRepo.GetLessonsByTutor(ctx, request.TutorID)
	if err != nil {
		return nil, err
	}

	// Check for time slot conflicts
	for _, lesson := range existingLessons {
		// Skip cancelled lessons when checking for conflicts
		if lesson.CancelledAt != nil {
			continue
		}

		if (request.StartTime.Before(lesson.EndTime) && request.EndTime.After(lesson.StartTime)) ||
			(request.StartTime.Equal(lesson.StartTime) && request.EndTime.Equal(lesson.EndTime)) {
			return nil, errors.New("time slot is not available")
		}
	}

	// Create the lesson
	lesson := &entities.Lesson{
		StudentID:  studentID,
		TutorID:    request.TutorID,
		LanguageID: request.LanguageID,
		StartTime:  request.StartTime,
		EndTime:    request.EndTime,
		Notes:      request.Notes,
	}

	err = uc.lessonRepo.CreateLesson(ctx, lesson)
	if err != nil {
		return nil, err
	}

	// If tutor is not approved, return a specific error type that includes the lesson
	if !tutorProfile.Approved {
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

	// Set cancellation info
	now := time.Now()
	lesson.CancelledBy = &userID
	lesson.CancelledAt = &now

	// If notes provided in the request, append them to existing notes
	if request.Reason != "" {
		cancellationNote := fmt.Sprintf("Cancelled: %s", request.Reason)
		if lesson.Notes != nil {
			combinedNotes := *lesson.Notes + "\n" + cancellationNote
			lesson.Notes = &combinedNotes
		} else {
			lesson.Notes = &cancellationNote
		}
	}

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

func (uc *lessonUseCase) GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetUpcomingByUserID(ctx, userID)
}

func (uc *lessonUseCase) GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetCompletedByUserID(ctx, userID)
}

// Helper functions
func generateRoomID(lessonID int) string {
	return fmt.Sprintf("lesson_%d_%d", lessonID, time.Now().Unix())
}

func generateSessionToken() string {
	// In a real implementation, this would generate a secure token
	return fmt.Sprintf("session_%d", time.Now().Unix())
}
