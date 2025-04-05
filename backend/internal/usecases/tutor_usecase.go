package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// TutorUseCase handles business logic for tutors
type TutorUseCase struct {
	tutorRepo   *repositories.TutorRepository
	userRepo    *repositories.UserRepository
	studentRepo *repositories.StudentRepository
	lessonRepo  *repositories.LessonRepository
}

// NewTutorUseCase creates a new TutorUseCase
func NewTutorUseCase(
	tutorRepo *repositories.TutorRepository,
	userRepo *repositories.UserRepository,
	studentRepo *repositories.StudentRepository,
	lessonRepo *repositories.LessonRepository,
) *TutorUseCase {
	return &TutorUseCase{
		tutorRepo:   tutorRepo,
		userRepo:    userRepo,
		studentRepo: studentRepo,
		lessonRepo:  lessonRepo,
	}
}

// GetTutorProfile retrieves a tutor's profile with all related information
func (uc *TutorUseCase) GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error) {
	// Get tutor profile
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, tutorID)
	if err != nil {
		return nil, err
	}
	if tutorProfile == nil {
		return nil, errors.New("tutor profile not found")
	}

	// Get tutor user information
	user, err := uc.userRepo.GetByID(ctx, tutorID)
	if err != nil {
		return nil, err
	}
	tutorProfile.User = user

	// Get tutor languages
	languages, err := uc.studentRepo.GetLanguages(ctx, tutorID)
	if err != nil {
		return nil, err
	}
	tutorProfile.Languages = languages

	// Get average rating
	rating, err := uc.lessonRepo.GetTutorAverageRating(ctx, tutorID)
	if err == nil {
		tutorProfile.Rating = rating
	}

	// Get reviews count
	reviewsCount, err := uc.lessonRepo.GetTutorReviewsCount(ctx, tutorID)
	if err == nil {
		tutorProfile.ReviewsCount = reviewsCount
	}

	return tutorProfile, nil
}

// UpdateTutorProfile updates a tutor's profile information
func (uc *TutorUseCase) UpdateTutorProfile(ctx context.Context, tutorID int, req *entities.TutorUpdateRequest) error {
	// Get existing profile
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, tutorID)
	if err != nil {
		return err
	}
	if tutorProfile == nil {
		return errors.New("tutor profile not found")
	}

	// Update fields if provided
	if req.Bio != "" {
		tutorProfile.Bio = req.Bio
	}
	if req.Education != nil {
		tutorProfile.Education = req.Education
	}
	if req.IntroVideoURL != "" {
		tutorProfile.IntroVideoURL = req.IntroVideoURL
	}
	if req.YearsExperience != nil {
		tutorProfile.YearsExperience = *req.YearsExperience
	}

	// Save updated profile
	return uc.tutorRepo.Update(ctx, tutorProfile)
}

// AddTutorAvailability adds a new availability slot for a tutor
func (uc *TutorUseCase) AddTutorAvailability(ctx context.Context, tutorID int, req *entities.TutorAvailabilityRequest) (*entities.TutorAvailability, error) {
	// Validate tutor exists
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, tutorID)
	if err != nil {
		return nil, err
	}
	if tutorProfile == nil {
		return nil, errors.New("tutor profile not found")
	}

	// Create new availability
	availability := &entities.TutorAvailability{
		TutorID:      tutorID,
		DayOfWeek:    req.DayOfWeek,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		IsRecurring:  req.IsRecurring,
		SpecificDate: req.SpecificDate,
	}

	// Save availability
	err = uc.tutorRepo.AddAvailability(ctx, availability)
	if err != nil {
		return nil, err
	}

	return availability, nil
}

// UpdateTutorAvailability updates an existing availability slot
func (uc *TutorUseCase) UpdateTutorAvailability(ctx context.Context, tutorID int, availabilityID int, req *entities.TutorAvailabilityRequest) (*entities.TutorAvailability, error) {
	// Validate tutor and availability combination
	availabilities, err := uc.tutorRepo.GetAvailabilities(ctx, tutorID)
	if err != nil {
		return nil, err
	}

	var found bool
	for _, a := range availabilities {
		if a.ID == availabilityID {
			found = true
			break
		}
	}

	if !found {
		return nil, errors.New("availability not found for this tutor")
	}

	// Update availability
	availability := &entities.TutorAvailability{
		ID:           availabilityID,
		TutorID:      tutorID,
		DayOfWeek:    req.DayOfWeek,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		IsRecurring:  req.IsRecurring,
		SpecificDate: req.SpecificDate,
	}

	err = uc.tutorRepo.UpdateAvailability(ctx, availability)
	if err != nil {
		return nil, err
	}

	return availability, nil
}

// DeleteTutorAvailability deletes an availability slot
func (uc *TutorUseCase) DeleteTutorAvailability(ctx context.Context, tutorID int, availabilityID int) error {
	return uc.tutorRepo.DeleteAvailability(ctx, availabilityID, tutorID)
}

// GetTutorAvailabilities retrieves all availabilities for a tutor
func (uc *TutorUseCase) GetTutorAvailabilities(ctx context.Context, tutorID int) ([]entities.TutorAvailability, error) {
	return uc.tutorRepo.GetAvailabilities(ctx, tutorID)
}

// SearchTutors searches for tutors based on filters
func (uc *TutorUseCase) SearchTutors(ctx context.Context, filters *entities.TutorSearchFilters) ([]entities.TutorProfile, error) {
	tutors, err := uc.tutorRepo.SearchTutors(ctx, filters)
	if err != nil {
		return nil, err
	}

	// For each tutor, enrich with additional information
	for i := range tutors {
		// Get user information
		user, err := uc.userRepo.GetByID(ctx, tutors[i].UserID)
		if err != nil {
			continue // Skip if can't get user info
		}
		tutors[i].User = user

		// Get languages
		languages, err := uc.studentRepo.GetLanguages(ctx, tutors[i].UserID)
		if err != nil {
			continue // Skip if can't get languages
		}
		tutors[i].Languages = languages

		// Get rating
		rating, err := uc.lessonRepo.GetTutorAverageRating(ctx, tutors[i].UserID)
		if err == nil {
			tutors[i].Rating = rating
		}

		// Get reviews count
		reviewsCount, err := uc.lessonRepo.GetTutorReviewsCount(ctx, tutors[i].UserID)
		if err == nil {
			tutors[i].ReviewsCount = reviewsCount
		}
	}

	return tutors, nil
}

// ApproveTutor approves a tutor to start teaching
func (uc *TutorUseCase) ApproveTutor(ctx context.Context, tutorID int) error {
	// Verify tutor exists
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, tutorID)
	if err != nil {
		return err
	}
	if tutorProfile == nil {
		return errors.New("tutor profile not found")
	}

	// Update approval status
	return uc.tutorRepo.UpdateApprovalStatus(ctx, tutorID, true)
}

// GetUpcomingLessons retrieves upcoming lessons for a tutor
func (uc *TutorUseCase) GetUpcomingLessons(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetUpcomingLessons(ctx, tutorID, false)
}

// GetPastLessons retrieves past lessons for a tutor
func (uc *TutorUseCase) GetPastLessons(ctx context.Context, tutorID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetPastLessons(ctx, tutorID, false)
}
