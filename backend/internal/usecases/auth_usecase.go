package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type AuthUseCase interface {
	Register(ctx context.Context, username, email, password, role string) (*entities.User, error)
	Authenticate(ctx context.Context, username, password string) (*entities.User, error)
}

type authUseCaseImpl struct {
	userRepo repositories.UserRepository
}

func NewAuthUseCase(userRepo repositories.UserRepository) AuthUseCase {
	return &authUseCaseImpl{
		userRepo: userRepo,
	}
}

// Register handles user registration
func (uc *authUseCaseImpl) Register(ctx context.Context, username, email, password, role string) (*entities.User, error) {
	logger.Info("Starting user registration process",
		"username", username,
		"email", email,
		"role", role)

	// Create new user
	user := &entities.User{
		Username: username,
		Email:    email,
		Role:     role,
	}

	// Hash the password
	if err := user.HashPassword(password); err != nil {
		logger.Error("Failed to hash password", "error", err)
		return nil, errors.New("failed to process password")
	}

	// Create user
	if err := uc.userRepo.CreateUser(ctx, user); err != nil {
		logger.Error("Failed to create user",
			"username", username,
			"error", err)
		return nil, err
	}

	// Get the complete user data
	user, err := uc.userRepo.GetUserByUsername(ctx, username)
	if err != nil {
		logger.Error("Failed to get user after creation",
			"username", username,
			"error", err)
		return nil, err
	}

	logger.Info("User registration completed successfully",
		"username", username,
		"user_id", user.ID)
	return user, nil
}

// Authenticate handles user login
func (uc *authUseCaseImpl) Authenticate(ctx context.Context, username, password string) (*entities.User, error) {
	logger.Info("Starting authentication process", "username", username)

	// Fetch the user by username
	user, err := uc.userRepo.GetUserByUsername(ctx, username)
	if err != nil {
		logger.Error("Failed to fetch user",
			"username", username,
			"error", err)
		return nil, err
	}
	if user == nil {
		logger.Error("User not found", "username", username)
		return nil, errors.New("user not found")
	}

	logger.Info("User found, validating password", "username", username)

	// Validate the password
	if !user.ValidatePassword(password) {
		logger.Error("Invalid password", "username", username)
		return nil, errors.New("invalid credentials")
	}

	logger.Info("Authentication successful",
		"username", username,
		"user_id", user.ID)
	return user, nil
}
