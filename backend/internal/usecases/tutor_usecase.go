package usecases

import (
	"context"
	"errors"
	"fmt"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type TutorUseCase struct {
	TutorRepo repositories.TutorRepository
	UserRepo  repositories.UserRepository
}

func NewTutorUseCase(
	tutorRepo repositories.TutorRepository,
	userRepo repositories.UserRepository,
) *TutorUseCase {
	return &TutorUseCase{
		TutorRepo: tutorRepo,
		UserRepo:  userRepo,
	}
}

// TutorFilters represents the available filtering options for tutors
type TutorFilters struct {
	ApprovalStatus string `json:"approval_status"`
	Language       string `json:"language"`
}

// RegisterTutor handles tutor registration
func (uc *TutorUseCase) RegisterTutor(ctx context.Context, userID int, req entities.TutorRegistrationRequest) error {
	logger.Info("Starting tutor registration", "user_id", userID)

	// Get user to verify role
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return err
	}

	// Validate tutor data
	if req.Bio == "" {
		return errors.New("bio is required")
	}
	if len(req.TeachingLanguages) == 0 {
		return errors.New("at least one teaching language is required")
	}

	// Convert Education from interface{} if needed
	var educationList []entities.Education
	if req.Education != nil {
		switch education := req.Education.(type) {
		case []entities.Education:
			educationList = education
		case []interface{}:
			// Convert slice of interfaces to slice of Education
			for _, edu := range education {
				if eduMap, ok := edu.(map[string]interface{}); ok {
					var degree, institution, fieldOfStudy, startYear, endYear, documentURL string

					if val, ok := eduMap["degree"].(string); ok {
						degree = val
					}
					if val, ok := eduMap["institution"].(string); ok {
						institution = val
					}
					if val, ok := eduMap["field_of_study"].(string); ok {
						fieldOfStudy = val
					}
					if val, ok := eduMap["start_year"].(string); ok {
						startYear = val
					}
					if val, ok := eduMap["end_year"].(string); ok {
						endYear = val
					}
					if val, ok := eduMap["documentUrl"].(string); ok {
						documentURL = val
					}

					educationList = append(educationList, entities.Education{
						Degree:       degree,
						Institution:  institution,
						FieldOfStudy: fieldOfStudy,
						StartYear:    startYear,
						EndYear:      endYear,
						DocumentURL:  documentURL,
					})
				}
			}
		}
	}

	// Create tutor profile
	profile := &entities.TutorProfile{
		UserID:            userID,
		Bio:               req.Bio,
		TeachingLanguages: []entities.Language{}, // Will be populated by the repository
		Education:         educationList,
		IntroductionVideo: req.IntroductionVideo,
		Approved:          false, // New tutors start as unapproved
	}

	// Create tutor profile
	if err := uc.TutorRepo.CreateTutorProfile(ctx, profile); err != nil {
		logger.Error("Failed to create tutor profile", "error", err)
		return fmt.Errorf("failed to create tutor: %w", err)
	}

	logger.Info("Tutor registration successful", "user_id", userID)
	return nil
}

// ListTutors fetches a list of all tutors with pagination
func (uc *TutorUseCase) ListTutors(ctx context.Context, page, pageSize int) ([]entities.TutorProfile, error) {
	logger.Info("Listing tutors", "page", page, "pageSize", pageSize)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	offset := (page - 1) * pageSize
	return uc.TutorRepo.ListTutors(ctx, pageSize, offset)
}

// UpdateTutorApprovalStatus updates a tutor's approval status
func (uc *TutorUseCase) UpdateTutorApprovalStatus(ctx context.Context, tutorID int, approved bool) error {
	logger.Info("Starting tutor approval status update", "tutor_id", tutorID)
	return uc.TutorRepo.UpdateTutorApprovalStatus(ctx, tutorID, approved)
}

// GetTutorDetails retrieves tutor details for a user
func (uc *TutorUseCase) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorProfile, error) {
	logger.Info("Starting tutor details retrieval", "user_id", userID)

	// Verify user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return nil, err
	}

	// Get tutor profile
	tutor, err := uc.TutorRepo.GetTutorProfileByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor profile", "error", err)
		return nil, err
	}

	if tutor == nil {
		logger.Error("Tutor profile not found", "user_id", userID)
		return nil, errors.New("tutor profile not found")
	}

	return tutor, nil
}

// UpdateTutorProfile updates a tutor's profile
func (uc *TutorUseCase) UpdateTutorProfile(ctx context.Context, userID int, req entities.TutorUpdateRequest) error {
	logger.Info("Starting tutor profile update", "user_id", userID)

	// Get user to verify role
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return err
	}

	// Validate tutor data
	if req.Bio == "" && len(req.TeachingLanguages) == 0 && req.Education == nil {
		return errors.New("at least one field must be provided for update")
	}

	// Get existing tutor profile
	profile, err := uc.TutorRepo.GetTutorProfileByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get tutor profile", "error", err)
		return err
	}

	// Create tutor profile if it doesn't exist
	if profile == nil {
		profile = &entities.TutorProfile{
			UserID:   userID,
			Approved: false,
		}
	}

	// Convert Education from interface{} if needed
	if req.Education != nil {
		var educationList []entities.Education
		switch education := req.Education.(type) {
		case []entities.Education:
			educationList = education
		case []interface{}:
			// Convert slice of interfaces to slice of Education
			for _, edu := range education {
				if eduMap, ok := edu.(map[string]interface{}); ok {
					var degree, institution, fieldOfStudy, startYear, endYear, documentURL string

					if val, ok := eduMap["degree"].(string); ok {
						degree = val
					}
					if val, ok := eduMap["institution"].(string); ok {
						institution = val
					}
					if val, ok := eduMap["field_of_study"].(string); ok {
						fieldOfStudy = val
					}
					if val, ok := eduMap["start_year"].(string); ok {
						startYear = val
					}
					if val, ok := eduMap["end_year"].(string); ok {
						endYear = val
					}
					if val, ok := eduMap["documentUrl"].(string); ok {
						documentURL = val
					}

					educationList = append(educationList, entities.Education{
						Degree:       degree,
						Institution:  institution,
						FieldOfStudy: fieldOfStudy,
						StartYear:    startYear,
						EndYear:      endYear,
						DocumentURL:  documentURL,
					})
				}
			}
		}
		profile.Education = educationList
	}

	// Update fields if provided
	if req.Bio != "" {
		profile.Bio = req.Bio
	}

	if req.Interests != nil {
		profile.Interests = req.Interests
	}

	if req.IntroductionVideo != "" {
		profile.IntroductionVideo = req.IntroductionVideo
	}

	// Update tutor profile
	if err := uc.TutorRepo.UpdateTutorProfile(ctx, profile); err != nil {
		logger.Error("Failed to update tutor profile", "error", err)
		return err
	}

	logger.Info("Tutor profile updated successfully", "user_id", userID)
	return nil
}

// SearchTutors searches for tutors based on filters
func (uc *TutorUseCase) SearchTutors(ctx context.Context, filters *entities.TutorSearchFilters) ([]entities.TutorProfile, error) {
	logger.Info("Searching tutors", "filters", filters)

	// Convert filters to map
	filterMap := make(map[string]interface{})
	if filters != nil && len(filters.Languages) > 0 {
		filterMap["languages"] = filters.Languages
	}

	return uc.TutorRepo.SearchTutors(ctx, filterMap)
}
