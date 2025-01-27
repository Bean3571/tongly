package usecases

import (
	"errors"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/repositories"
)

type AuthUseCase struct {
	UserRepo repositories.UserRepository
}

// Register handles user registration
func (uc *AuthUseCase) Register(user entities.User) error {
	// Hash the password before saving
	if err := user.HashPassword(user.Password); err != nil {
		return err
	}

	// Save the user to the database
	return uc.UserRepo.CreateUser(user)
}

// Authenticate handles user login
func (uc *AuthUseCase) Authenticate(username, password string) (*entities.User, error) {
	// Fetch the user by username
	user, err := uc.UserRepo.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Validate the password
	if !user.ValidatePassword(password) {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}
