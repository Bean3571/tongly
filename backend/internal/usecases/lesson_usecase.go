package usecases

import (
	"context"
	"errors"
	"time"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// LessonUseCase handles business logic for lessons
type LessonUseCase struct {
	lessonRepo  *repositories.LessonRepository
	userRepo    *repositories.UserRepository
	tutorRepo   *repositories.TutorRepository
	studentRepo *repositories.StudentRepository
	langRepo    *repositories.LanguageRepository
}

// NewLessonUseCase creates a new LessonUseCase
func NewLessonUseCase(
	lessonRepo *repositories.LessonRepository,
	userRepo *repositories.UserRepository,
	tutorRepo *repositories.TutorRepository,
	studentRepo *repositories.StudentRepository,
	langRepo *repositories.LanguageRepository,
) *LessonUseCase {
	return &LessonUseCase{
		lessonRepo:  lessonRepo,
		userRepo:    userRepo,
		tutorRepo:   tutorRepo,
		studentRepo: studentRepo,
		langRepo:    langRepo,
	}
}

// BookLesson books a new lesson
func (uc *LessonUseCase) BookLesson(ctx context.Context, studentID int, req *entities.LessonBookingRequest) (*entities.Lesson, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Check if student exists
	studentProfile, err := uc.studentRepo.GetByUserID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	if studentProfile == nil {
		return nil, errors.New("student not found")
	}

	// Check if tutor exists and is approved
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, req.TutorID)
	if err != nil {
		return nil, err
	}
	if tutorProfile == nil {
		return nil, errors.New("tutor not found")
	}

	// Check if language exists
	language, err := uc.langRepo.GetLanguageByID(ctx, req.LanguageID)
	if err != nil {
		return nil, err
	}
	if language == nil {
		return nil, errors.New("language not found")
	}

	// Check tutor availability
	// This would be a more complex check in a real system
	// For now, we'll just check if the requested time is in the future
	if req.StartTime.Before(time.Now()) {
		return nil, errors.New("lesson start time must be in the future")
	}

	// Create the lesson
	lesson := &entities.Lesson{
		StudentID:  studentID,
		TutorID:    req.TutorID,
		LanguageID: req.LanguageID,
		StartTime:  req.StartTime,
		EndTime:    req.EndTime,
		Notes:      req.Notes,
	}

	// Save to database
	if err := uc.lessonRepo.Create(ctx, lesson); err != nil {
		return nil, err
	}

	return lesson, nil
}

// GetLessonByID retrieves a lesson by ID
func (uc *LessonUseCase) GetLessonByID(ctx context.Context, lessonID int) (*entities.Lesson, error) {
	// Get lesson
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if lesson == nil {
		return nil, errors.New("lesson not found")
	}

	// Populate related entities
	if err := uc.populateLessonRelations(ctx, lesson); err != nil {
		return nil, err
	}

	// Get reviews
	reviews, err := uc.lessonRepo.GetReviewsByLessonID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	lesson.Reviews = reviews

	return lesson, nil
}

// CancelLesson cancels a lesson
func (uc *LessonUseCase) CancelLesson(ctx context.Context, lessonID int, userID int) error {
	// Get lesson
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if lesson == nil {
		return errors.New("lesson not found")
	}

	// Check if user is associated with this lesson
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return errors.New("user not authorized to cancel this lesson")
	}

	// Check if lesson can be cancelled
	if err := lesson.CanCancel(); err != nil {
		return err
	}

	// Cancel the lesson
	return uc.lessonRepo.CancelLesson(ctx, lessonID, userID)
}

// UpdateLessonNotes updates notes for a lesson
func (uc *LessonUseCase) UpdateLessonNotes(ctx context.Context, lessonID int, userID int, notes string) error {
	// Get lesson
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return err
	}
	if lesson == nil {
		return errors.New("lesson not found")
	}

	// Check if user is associated with this lesson
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return errors.New("user not authorized to update this lesson")
	}

	// Update notes
	return uc.lessonRepo.UpdateLessonNotes(ctx, lessonID, notes)
}

// AddReview adds a review for a lesson
func (uc *LessonUseCase) AddReview(ctx context.Context, lessonID int, userID int, rating int) (*entities.Review, error) {
	// Get lesson
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	if lesson == nil {
		return nil, errors.New("lesson not found")
	}

	// Check if user is associated with this lesson
	if lesson.StudentID != userID && lesson.TutorID != userID {
		return nil, errors.New("user not authorized to review this lesson")
	}

	// Check if lesson is completed
	if lesson.GetStatus() != entities.LessonStatusCompleted {
		return nil, errors.New("only completed lessons can be reviewed")
	}

	// Check if user has already reviewed this lesson
	reviews, err := uc.lessonRepo.GetReviewsByLessonID(ctx, lessonID)
	if err != nil {
		return nil, err
	}
	for _, review := range reviews {
		if review.ReviewerID == userID {
			return nil, errors.New("user has already reviewed this lesson")
		}
	}

	// Create review
	review := &entities.Review{
		LessonID:   lessonID,
		ReviewerID: userID,
		Rating:     rating,
	}

	// Save review
	if err := uc.lessonRepo.AddReview(ctx, review); err != nil {
		return nil, err
	}

	return review, nil
}

// GetLessonsByStudent retrieves all lessons for a student
func (uc *LessonUseCase) GetLessonsByStudent(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetByStudentID(ctx, studentID)
}

// GetLessonsByTutor retrieves all lessons for a tutor
func (uc *LessonUseCase) GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetByTutorID(ctx, tutorID)
}

// GetUpcomingLessonsByUser retrieves upcoming lessons for a user (either student or tutor)
func (uc *LessonUseCase) GetUpcomingLessonsByUser(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	lessons, err := uc.lessonRepo.GetUpcomingLessons(ctx, userID, isStudent)
	if err != nil {
		return nil, err
	}

	// Populate related entities for each lesson
	for i := range lessons {
		uc.populateLessonRelations(ctx, &lessons[i])
	}

	return lessons, nil
}

// GetPastLessonsByUser retrieves past lessons for a user (either student or tutor)
func (uc *LessonUseCase) GetPastLessonsByUser(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	lessons, err := uc.lessonRepo.GetPastLessons(ctx, userID, isStudent)
	if err != nil {
		return nil, err
	}

	// Populate related entities for each lesson
	for i := range lessons {
		uc.populateLessonRelations(ctx, &lessons[i])
	}

	return lessons, nil
}

// GetAllLessonsByUser retrieves all lessons for a user (either student or tutor)
func (uc *LessonUseCase) GetAllLessonsByUser(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	var lessons []entities.Lesson
	var err error

	if isStudent {
		lessons, err = uc.lessonRepo.GetByStudentID(ctx, userID)
	} else {
		lessons, err = uc.lessonRepo.GetByTutorID(ctx, userID)
	}

	if err != nil {
		return nil, err
	}

	// Populate related entities for each lesson
	for i := range lessons {
		uc.populateLessonRelations(ctx, &lessons[i])
	}

	return lessons, nil
}

// GetCancelledLessonsByUser retrieves cancelled lessons for a user
func (uc *LessonUseCase) GetCancelledLessonsByUser(ctx context.Context, userID int, isStudent bool) ([]entities.Lesson, error) {
	lessons, err := uc.lessonRepo.GetCancelledLessons(ctx, userID, isStudent)
	if err != nil {
		return nil, err
	}

	// Populate related entities for each lesson
	for i := range lessons {
		uc.populateLessonRelations(ctx, &lessons[i])
	}

	return lessons, nil
}

// Helper method to populate lesson relations
func (uc *LessonUseCase) populateLessonRelations(ctx context.Context, lesson *entities.Lesson) error {
	// Get student info
	student, err := uc.userRepo.GetByID(ctx, lesson.StudentID)
	if err != nil {
		return err
	}
	lesson.Student = student

	// Get tutor info
	tutor, err := uc.userRepo.GetByID(ctx, lesson.TutorID)
	if err != nil {
		return err
	}
	lesson.Tutor = tutor

	// Get language info
	language, err := uc.langRepo.GetLanguageByID(ctx, lesson.LanguageID)
	if err != nil {
		return err
	}
	lesson.Language = language

	return nil
}
