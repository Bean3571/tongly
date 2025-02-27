package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type TutorUseCase struct {
	UserRepo  repositories.UserRepository
	TutorRepo repositories.TutorRepository
}

func NewTutorUseCase(userRepo repositories.UserRepository, tutorRepo repositories.TutorRepository) *TutorUseCase {
	return &TutorUseCase{
		UserRepo:  userRepo,
		TutorRepo: tutorRepo,
	}
}

// TutorFilters represents the available filtering options for tutors
type TutorFilters struct {
	ApprovalStatus string  `json:"approval_status"`
	MinHourlyRate  float64 `json:"min_hourly_rate"`
	MaxHourlyRate  float64 `json:"max_hourly_rate"`
	OffersTrial    bool    `json:"offers_trial"`
	Language       string  `json:"language"`
}

// RegisterTutor handles tutor registration
func (uc *TutorUseCase) RegisterTutor(ctx context.Context, userID int, req entities.TutorRegistrationRequest) error {
	logger.Info("Starting tutor registration", "user_id", userID)

	// Get user to verify role
	user, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Verify user is a tutor
	if user.Credentials.Role != "tutor" {
		return errors.New("user is not a tutor")
	}

	// Create tutor details
	details := &entities.TutorDetails{
		UserID:            userID,
		Bio:               req.Bio,
		TeachingLanguages: req.TeachingLanguages,
		Education:         req.Education,
		HourlyRate:        req.HourlyRate,
		IntroductionVideo: req.IntroductionVideo,
		Approved:          false, // New tutors start as unapproved
	}

	// Create tutor details
	if err := uc.UserRepo.CreateTutorDetails(ctx, details); err != nil {
		logger.Error("Failed to create tutor details", "error", err)
		return err
	}

	logger.Info("Tutor registration successful", "user_id", userID)
	return nil
}

// ListTutors retrieves a list of tutors with optional filtering
func (uc *TutorUseCase) ListTutors(ctx context.Context, page, pageSize int, filters TutorFilters) ([]*entities.User, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize

	// Convert filters to map for repository
	filterMap := make(map[string]interface{})
	if filters.ApprovalStatus != "" {
		filterMap["approved"] = filters.ApprovalStatus == "approved"
	}
	if filters.MinHourlyRate > 0 {
		filterMap["min_hourly_rate"] = filters.MinHourlyRate
	}
	if filters.MaxHourlyRate > 0 {
		filterMap["max_hourly_rate"] = filters.MaxHourlyRate
	}
	if filters.OffersTrial {
		filterMap["offers_trial"] = true
	}
	if filters.Language != "" {
		filterMap["language"] = filters.Language
	}

	return uc.UserRepo.ListTutors(ctx, pageSize, offset, filterMap)
}

// UpdateTutorApprovalStatus updates a tutor's approval status
func (uc *TutorUseCase) UpdateTutorApprovalStatus(ctx context.Context, userID int, approved bool) error {
	// Get tutor details
	details, err := uc.UserRepo.GetTutorDetails(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		return err
	}
	if details == nil {
		return errors.New("tutor not found")
	}

	// Update approval status
	details.Approved = approved

	// Update details
	if err := uc.UserRepo.UpdateTutorDetails(ctx, details); err != nil {
		logger.Error("Failed to update tutor approval status", "error", err)
		return err
	}

	logger.Info("Tutor approval status updated",
		"user_id", userID,
		"approved", approved)
	return nil
}

// GetTutorDetails retrieves tutor details for a user
func (uc *TutorUseCase) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error) {
	// Get user to verify role
	user, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Verify user is a tutor
	if user.Credentials.Role != "tutor" {
		return nil, errors.New("user is not a tutor")
	}

	// Get tutor details
	details, err := uc.UserRepo.GetTutorDetails(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		return nil, err
	}

	return details, nil
}

// UpdateTutorProfile updates a tutor's profile
func (uc *TutorUseCase) UpdateTutorProfile(ctx context.Context, userID int, req entities.TutorUpdateRequest) error {
	logger.Info("Starting tutor profile update", "user_id", userID)

	// Get user to verify role
	user, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Verify user is a tutor
	if user.Credentials.Role != "tutor" {
		return errors.New("user is not a tutor")
	}

	// Get existing tutor details
	details, err := uc.UserRepo.GetTutorDetails(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		return err
	}

	// Create tutor details if they don't exist
	if details == nil {
		details = &entities.TutorDetails{
			UserID:     userID,
			HourlyRate: 25.0, // Default hourly rate
			Approved:   false,
		}
	}

	// Update fields
	details.Bio = req.Bio
	details.TeachingLanguages = req.TeachingLanguages
	details.Education = req.Education
	details.Interests = req.Interests
	details.HourlyRate = req.HourlyRate
	details.IntroductionVideo = req.IntroductionVideo

	// Create or update tutor details
	if details.ID == 0 {
		err = uc.UserRepo.CreateTutorDetails(ctx, details)
	} else {
		err = uc.UserRepo.UpdateTutorDetails(ctx, details)
	}

	if err != nil {
		logger.Error("Failed to update tutor details", "error", err)
		return err
	}

	logger.Info("Tutor profile updated successfully", "user_id", userID)
	return nil
}

// UpdateTutorVideo updates the introduction video URL for a tutor
func (uc *TutorUseCase) UpdateTutorVideo(ctx context.Context, userID int, videoURL string) error {
	logger.Info("Starting tutor video update", "user_id", userID)

	// Get existing tutor details
	details, err := uc.UserRepo.GetTutorDetails(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		return err
	}

	// Create tutor details if they don't exist
	if details == nil {
		details = &entities.TutorDetails{
			UserID:     userID,
			HourlyRate: 25.0, // Default hourly rate
			Approved:   false,
		}
	}

	// Update video URL
	details.IntroductionVideo = videoURL

	// Create or update tutor details
	if details.ID == 0 {
		err = uc.UserRepo.CreateTutorDetails(ctx, details)
	} else {
		err = uc.UserRepo.UpdateTutorDetails(ctx, details)
	}

	if err != nil {
		logger.Error("Failed to update tutor video", "error", err)
		return err
	}

	logger.Info("Tutor video updated successfully", "user_id", userID)
	return nil
}

// SearchTutors searches for tutors based on filters
func (uc *TutorUseCase) SearchTutors(ctx context.Context, filters entities.TutorSearchFilters) ([]*entities.TutorProfile, error) {
	filterMap := make(map[string]interface{})

	if len(filters.Languages) > 0 {
		filterMap["languages"] = filters.Languages
	}
	if filters.MinPrice > 0 {
		filterMap["min_price"] = filters.MinPrice
	}
	if filters.MaxPrice > 0 {
		filterMap["max_price"] = filters.MaxPrice
	}

	return uc.TutorRepo.SearchTutors(ctx, filterMap)
}
