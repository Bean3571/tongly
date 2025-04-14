package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// UserPreferencesUseCase handles business logic for user preferences
type UserPreferencesUseCase struct {
	prefsRepo    *repositories.UserPreferencesRepository
	langRepo     *repositories.LanguageRepository
	interestRepo *repositories.InterestRepository
	goalRepo     *repositories.GoalRepository
}

// NewUserPreferencesUseCase creates a new UserPreferencesUseCase
func NewUserPreferencesUseCase(
	prefsRepo *repositories.UserPreferencesRepository,
	langRepo *repositories.LanguageRepository,
	interestRepo *repositories.InterestRepository,
	goalRepo *repositories.GoalRepository,
) *UserPreferencesUseCase {
	return &UserPreferencesUseCase{
		prefsRepo:    prefsRepo,
		langRepo:     langRepo,
		interestRepo: interestRepo,
		goalRepo:     goalRepo,
	}
}

// GetUserLanguages retrieves languages for a user
func (uc *UserPreferencesUseCase) GetUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	return uc.prefsRepo.GetUserLanguages(ctx, userID)
}

// AddUserLanguage adds a language to a user's profile
func (uc *UserPreferencesUseCase) AddUserLanguage(ctx context.Context, userID, languageID, proficiencyID int) (*entities.UserLanguage, error) {
	// Validate that the language exists
	language, err := uc.langRepo.GetLanguageByID(ctx, languageID)
	if err != nil {
		return nil, err
	}
	if language == nil {
		return nil, errors.New("language not found")
	}

	// Validate that the proficiency exists
	proficiency, err := uc.langRepo.GetProficiencyByID(ctx, proficiencyID)
	if err != nil {
		return nil, err
	}
	if proficiency == nil {
		return nil, errors.New("proficiency not found")
	}

	// Add the language
	if err := uc.prefsRepo.AddUserLanguage(ctx, userID, languageID, proficiencyID); err != nil {
		return nil, err
	}

	// Return the added language
	return &entities.UserLanguage{
		UserID:        userID,
		LanguageID:    languageID,
		ProficiencyID: proficiencyID,
		Language:      language,
		Proficiency:   proficiency,
	}, nil
}

// UpdateUserLanguage updates a language proficiency for a user
func (uc *UserPreferencesUseCase) UpdateUserLanguage(ctx context.Context, userID, languageID, proficiencyID int) (*entities.UserLanguage, error) {
	// Validate that the proficiency exists
	proficiency, err := uc.langRepo.GetProficiencyByID(ctx, proficiencyID)
	if err != nil {
		return nil, err
	}
	if proficiency == nil {
		return nil, errors.New("proficiency not found")
	}

	// Update the language
	if err := uc.prefsRepo.UpdateUserLanguage(ctx, userID, languageID, proficiencyID); err != nil {
		return nil, err
	}

	// Get the language for the response
	language, err := uc.langRepo.GetLanguageByID(ctx, languageID)
	if err != nil {
		return nil, err
	}

	// Return the updated language
	return &entities.UserLanguage{
		UserID:        userID,
		LanguageID:    languageID,
		ProficiencyID: proficiencyID,
		Language:      language,
		Proficiency:   proficiency,
	}, nil
}

// RemoveUserLanguage removes a language from a user's profile
func (uc *UserPreferencesUseCase) RemoveUserLanguage(ctx context.Context, userID, languageID int) error {
	return uc.prefsRepo.RemoveUserLanguage(ctx, userID, languageID)
}

// GetUserInterests retrieves interests for a user
func (uc *UserPreferencesUseCase) GetUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	return uc.prefsRepo.GetUserInterests(ctx, userID)
}

// AddUserInterest adds an interest to a user's profile
func (uc *UserPreferencesUseCase) AddUserInterest(ctx context.Context, userID, interestID int) (*entities.UserInterest, error) {
	// Validate that the interest exists
	interest, err := uc.interestRepo.GetInterestByID(ctx, interestID)
	if err != nil {
		return nil, err
	}
	if interest == nil {
		return nil, errors.New("interest not found")
	}

	// Add the interest
	if err := uc.prefsRepo.AddUserInterest(ctx, userID, interestID); err != nil {
		return nil, err
	}

	// Return the added interest
	return &entities.UserInterest{
		UserID:     userID,
		InterestID: interestID,
		Interest:   interest,
	}, nil
}

// RemoveUserInterest removes an interest from a user's profile
func (uc *UserPreferencesUseCase) RemoveUserInterest(ctx context.Context, userID, interestID int) error {
	return uc.prefsRepo.RemoveUserInterest(ctx, userID, interestID)
}

// GetUserGoals retrieves goals for a user
func (uc *UserPreferencesUseCase) GetUserGoals(ctx context.Context, userID int) ([]entities.UserGoal, error) {
	return uc.prefsRepo.GetUserGoals(ctx, userID)
}

// AddUserGoal adds a goal to a user's profile
func (uc *UserPreferencesUseCase) AddUserGoal(ctx context.Context, userID, goalID int) (*entities.UserGoal, error) {
	// Validate that the goal exists
	goal, err := uc.goalRepo.GetGoalByID(ctx, goalID)
	if err != nil {
		return nil, err
	}
	if goal == nil {
		return nil, errors.New("goal not found")
	}

	// Add the goal
	if err := uc.prefsRepo.AddUserGoal(ctx, userID, goalID); err != nil {
		return nil, err
	}

	// Return the added goal
	return &entities.UserGoal{
		UserID: userID,
		GoalID: goalID,
		Goal:   goal,
	}, nil
}

// RemoveUserGoal removes a goal from a user's profile
func (uc *UserPreferencesUseCase) RemoveUserGoal(ctx context.Context, userID, goalID int) error {
	return uc.prefsRepo.RemoveUserGoal(ctx, userID, goalID)
}
