package usecases

import (
	"context"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// CommonUseCase handles business logic for common data like languages, interests, and goals
type CommonUseCase struct {
	langRepo     *repositories.LanguageRepository
	interestRepo *repositories.InterestRepository
	goalRepo     *repositories.GoalRepository
}

// NewCommonUseCase creates a new CommonUseCase
func NewCommonUseCase(
	langRepo *repositories.LanguageRepository,
	interestRepo *repositories.InterestRepository,
	goalRepo *repositories.GoalRepository,
) *CommonUseCase {
	return &CommonUseCase{
		langRepo:     langRepo,
		interestRepo: interestRepo,
		goalRepo:     goalRepo,
	}
}

// GetAllLanguages returns all languages
func (uc *CommonUseCase) GetAllLanguages(ctx context.Context) ([]entities.Language, error) {
	return uc.langRepo.GetAllLanguages(ctx)
}

// GetAllProficiencies returns all language proficiency levels
func (uc *CommonUseCase) GetAllProficiencies(ctx context.Context) ([]entities.LanguageProficiency, error) {
	return uc.langRepo.GetAllProficiencies(ctx)
}

// GetLanguageByID returns a language by ID
func (uc *CommonUseCase) GetLanguageByID(ctx context.Context, id int) (*entities.Language, error) {
	return uc.langRepo.GetLanguageByID(ctx, id)
}

// GetProficiencyByID returns a proficiency level by ID
func (uc *CommonUseCase) GetProficiencyByID(ctx context.Context, id int) (*entities.LanguageProficiency, error) {
	return uc.langRepo.GetProficiencyByID(ctx, id)
}

// GetAllInterests returns all interests
func (uc *CommonUseCase) GetAllInterests(ctx context.Context) ([]entities.Interest, error) {
	return uc.interestRepo.GetAllInterests(ctx)
}

// GetInterestByID returns an interest by ID
func (uc *CommonUseCase) GetInterestByID(ctx context.Context, id int) (*entities.Interest, error) {
	return uc.interestRepo.GetInterestByID(ctx, id)
}

// GetAllGoals returns all goals
func (uc *CommonUseCase) GetAllGoals(ctx context.Context) ([]entities.Goal, error) {
	return uc.goalRepo.GetAllGoals(ctx)
}

// GetGoalByID returns a goal by ID
func (uc *CommonUseCase) GetGoalByID(ctx context.Context, id int) (*entities.Goal, error) {
	return uc.goalRepo.GetGoalByID(ctx, id)
}
