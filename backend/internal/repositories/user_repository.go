package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// UserRepository defines the interface for user-related database operations
type UserRepository interface {
	// User operations
	CreateUser(ctx context.Context, user *entities.User) error
	GetUserByUsername(ctx context.Context, username string) (*entities.User, error)
	GetUserByID(ctx context.Context, id int) (*entities.User, error)
	UpdateUser(ctx context.Context, user *entities.User) error

	// Language operations
	AddUserLanguage(ctx context.Context, userLanguage *entities.UserLanguage) error
	GetUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error)
	UpdateUserLanguage(ctx context.Context, userLanguage *entities.UserLanguage) error
	RemoveUserLanguage(ctx context.Context, userID int, languageID int) error

	// Interest operations
	AddUserInterest(ctx context.Context, userID int, interestID int) error
	GetUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error)
	RemoveUserInterest(ctx context.Context, userID int, interestID int) error

	// Goal operations
	AddUserGoal(ctx context.Context, userID int, goalID int) error
	GetUserGoals(ctx context.Context, userID int) ([]entities.UserGoal, error)
	RemoveUserGoal(ctx context.Context, userID int, goalID int) error

	// Reference data
	GetAllLanguages(ctx context.Context) ([]entities.Language, error)
	GetAllInterests(ctx context.Context) ([]entities.Interest, error)
	GetAllGoals(ctx context.Context) ([]entities.Goal, error)
	GetAllProficiencies(ctx context.Context) ([]entities.Proficiency, error)
}
