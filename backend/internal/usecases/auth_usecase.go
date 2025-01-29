package usecases

import (
	"errors"
	"tongly-basic/backend/internal/entities"
	"tongly-basic/backend/internal/logger"
	"tongly-basic/backend/internal/repositories"
)

type AuthUseCase struct {
	UserRepo repositories.UserRepository
}

// Add after the AuthUseCase struct definition
func NewAuthUseCase(userRepo repositories.UserRepository) *AuthUseCase {
	return &AuthUseCase{
		UserRepo: userRepo,
	}
}

// Register handles user registration
func (uc *AuthUseCase) Register(user entities.User) error {
	logger.Info("Starting user registration process",
		"username", user.Username,
		"email", user.Email)

	// Hash the password before saving
	if err := user.HashPassword(user.Password); err != nil {
		logger.Error("Failed to hash password", "error", err)
		return errors.New("failed to process password")
	}

	// Save the user to the database
	if err := uc.UserRepo.CreateUser(user); err != nil {
		logger.Error("Failed to create user in database",
			"username", user.Username,
			"error", err)
		return err
	}

	logger.Info("User registration completed successfully",
		"username", user.Username)
	return nil
}

// Authenticate handles user login
func (uc *AuthUseCase) Authenticate(username, password string) (*entities.User, error) {
	logger.Info("Starting authentication process", "username", username)

	// Fetch the user by username
	user, err := uc.UserRepo.GetUserByUsername(username)
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
