package usecases

import (
	"context"
	"database/sql"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type TutorUseCase struct {
	TutorRepo repositories.TutorRepository
	UserRepo  repositories.UserRepository
}

func NewTutorUseCase(tutorRepo repositories.TutorRepository, userRepo repositories.UserRepository) *TutorUseCase {
	return &TutorUseCase{
		TutorRepo: tutorRepo,
		UserRepo:  userRepo,
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

// RegisterTutor handles the tutor registration process
func (uc *TutorUseCase) RegisterTutor(ctx context.Context, userID int, req entities.TutorRegistrationRequest) error {
	logger.Info("Starting tutor registration process", "user_id", userID)

	// Get user profile
	user, err := uc.UserRepo.GetUserByID(userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Check if user is already a tutor
	existingTutor, err := uc.TutorRepo.GetTutorByUserID(ctx, userID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		logger.Error("Failed to check existing tutor", "error", err, "user_id", userID)
		return err
	}
	if existingTutor != nil {
		return errors.New("user is already registered as a tutor")
	}

	// Create tutor record with default not_approved status
	tutor := &entities.Tutor{
		UserID:               userID,
		EducationDegree:      req.EducationDegree,
		EducationInstitution: req.EducationInstitution,
		IntroductionVideo:    req.IntroductionVideo,
		HourlyRate:           req.HourlyRate,
		OffersTrial:          req.OffersTrial,
		ApprovalStatus:       "pending",
	}

	err = uc.TutorRepo.CreateTutor(ctx, tutor)
	if err != nil {
		logger.Error("Failed to create tutor", "error", err, "user_id", userID)
		return err
	}

	// Create empty tutor profile
	profile := &entities.TutorProfile{
		TutorID:           tutor.ID,
		NativeLanguages:   []string{},
		TeachingLanguages: []entities.LanguageLevel{},
		Interests:         []string{},
		HourlyRate:        req.HourlyRate,
		OffersTrial:       req.OffersTrial,
		IntroductionVideo: req.IntroductionVideo,
		Degrees:           []entities.Degree{},
	}

	err = uc.TutorRepo.CreateTutorProfile(ctx, profile)
	if err != nil {
		logger.Error("Failed to create tutor profile", "error", err, "tutor_id", tutor.ID)
		return err
	}

	// Update user profile to mark as tutor
	if user.Profile == nil {
		user.Profile = &entities.UserProfile{
			UserID:  userID,
			IsTutor: true,
		}
		err = uc.UserRepo.CreateProfile(*user.Profile)
	} else {
		user.Profile.IsTutor = true
		err = uc.UserRepo.UpdateProfile(*user.Profile)
	}

	if err != nil {
		logger.Error("Failed to update user profile", "error", err, "user_id", userID)
		return err
	}

	logger.Info("Tutor registration completed successfully", "user_id", userID, "tutor_id", tutor.ID)
	return nil
}

// GetTutorByID retrieves a tutor by their ID
func (uc *TutorUseCase) GetTutorByID(ctx context.Context, id int) (*entities.Tutor, error) {
	tutor, err := uc.TutorRepo.GetTutorByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if tutor == nil {
		return nil, nil
	}

	// Get tutor profile
	profile, err := uc.TutorRepo.GetTutorProfile(ctx, tutor.ID)
	if err != nil {
		return nil, err
	}
	tutor.Profile = profile

	return tutor, nil
}

// GetTutorByUserID retrieves a tutor by their user ID
func (uc *TutorUseCase) GetTutorByUserID(ctx context.Context, userID int) (*entities.Tutor, error) {
	return uc.TutorRepo.GetTutorByUserID(ctx, userID)
}

// ListTutors retrieves a list of tutors with optional filtering
func (uc *TutorUseCase) ListTutors(ctx context.Context, page, pageSize int, filters TutorFilters) ([]*entities.Tutor, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	filterMap := make(map[string]interface{})

	// Apply filters
	if filters.ApprovalStatus != "" {
		filterMap["approval_status"] = filters.ApprovalStatus
	} else {
		// By default, only show approved tutors
		filterMap["approval_status"] = "approved"
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

	return uc.TutorRepo.ListTutors(ctx, pageSize, offset, filterMap)
}

// UpdateTutorApprovalStatus updates a tutor's approval status
func (uc *TutorUseCase) UpdateTutorApprovalStatus(ctx context.Context, tutorID int, status string) error {
	if status != "approved" && status != "rejected" && status != "pending" {
		return errors.New("invalid approval status")
	}
	return uc.TutorRepo.UpdateTutorApprovalStatus(ctx, tutorID, status)
}

// UpdateTutorProfile updates a tutor's profile information
func (uc *TutorUseCase) UpdateTutorProfile(ctx context.Context, userID int, req entities.TutorProfileUpdateRequest) error {
	logger.Info("Starting tutor profile update", "user_id", userID)

	// Get tutor
	tutor, err := uc.TutorRepo.GetTutorByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor", "error", err, "user_id", userID)
		return err
	}
	if tutor == nil {
		return errors.New("tutor profile not found")
	}

	// Check if profile exists
	existingProfile, err := uc.TutorRepo.GetTutorProfile(ctx, tutor.ID)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		logger.Error("Failed to check existing profile", "error", err, "tutor_id", tutor.ID)
		return err
	}

	// Create profile if it doesn't exist
	if existingProfile == nil {
		logger.Info("Creating new tutor profile", "tutor_id", tutor.ID)
		profile := &entities.TutorProfile{
			TutorID:           tutor.ID,
			NativeLanguages:   []string{},
			TeachingLanguages: []entities.LanguageLevel{},
			Interests:         []string{},
			HourlyRate:        25.0,
			OffersTrial:       true,
			Degrees:           []entities.Degree{},
		}
		err = uc.TutorRepo.CreateTutorProfile(ctx, profile)
		if err != nil {
			logger.Error("Failed to create tutor profile", "error", err, "tutor_id", tutor.ID)
			return err
		}
	}

	// Update profile
	profile := &entities.TutorProfile{
		TutorID:           tutor.ID,
		NativeLanguages:   req.NativeLanguages,
		TeachingLanguages: req.TeachingLanguages,
		Bio:               req.Bio,
		Interests:         req.Interests,
		ProfilePicture:    req.ProfilePicture,
		HourlyRate:        req.HourlyRate,
		OffersTrial:       req.OffersTrial,
		IntroductionVideo: req.IntroductionVideo,
		Degrees:           req.Degrees,
	}

	// Also update the tutor record with relevant fields
	tutor.HourlyRate = req.HourlyRate
	tutor.OffersTrial = req.OffersTrial
	tutor.IntroductionVideo = req.IntroductionVideo
	err = uc.TutorRepo.UpdateTutor(ctx, tutor)
	if err != nil {
		logger.Error("Failed to update tutor", "error", err, "tutor_id", tutor.ID)
		return err
	}

	err = uc.TutorRepo.UpdateTutorProfile(ctx, profile)
	if err != nil {
		logger.Error("Failed to update tutor profile", "error", err, "tutor_id", tutor.ID)
		return err
	}

	logger.Info("Tutor profile updated successfully", "user_id", userID)
	return nil
}
