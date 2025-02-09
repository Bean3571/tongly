package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type AuthUseCase struct {
	UserRepo repositories.UserRepository
}

// Register handles user registration
func (uc *AuthUseCase) Register(ctx context.Context, username, email, password, role string) (*entities.User, error) {
	logger.Info("Starting user registration process",
		"username", username,
		"email", email,
		"role", role)

	// Create user credentials
	creds := entities.UserCredentials{
		Username: username,
		Email:    email,
		Role:     role,
	}

	// Hash the password
	if err := creds.HashPassword(password); err != nil {
		logger.Error("Failed to hash password", "error", err)
		return nil, errors.New("failed to process password")
	}

	// Create user credentials
	if err := uc.UserRepo.CreateUserCredentials(ctx, creds); err != nil {
		logger.Error("Failed to create user credentials",
			"username", username,
			"error", err)
		return nil, err
	}

	// Get the complete user data
	user, err := uc.UserRepo.GetUserByUsername(ctx, username)
	if err != nil {
		logger.Error("Failed to get user after creation",
			"username", username,
			"error", err)
		return nil, err
	}

	logger.Info("User registration completed successfully",
		"username", username,
		"user_id", user.Credentials.ID)
	return user, nil
}

// Authenticate handles user login
func (uc *AuthUseCase) Authenticate(ctx context.Context, username, password string) (*entities.User, error) {
	logger.Info("Starting authentication process", "username", username)

	// Fetch the user by username
	user, err := uc.UserRepo.GetUserByUsername(ctx, username)
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
	if !user.Credentials.ValidatePassword(password) {
		logger.Error("Invalid password", "username", username)
		return nil, errors.New("invalid credentials")
	}

	logger.Info("Authentication successful",
		"username", username,
		"user_id", user.Credentials.ID)
	return user, nil
}
