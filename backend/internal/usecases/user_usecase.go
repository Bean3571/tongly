package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// UserUseCase handles business logic for users
type UserUseCase struct {
	userRepo *repositories.UserRepository
}

// NewUserUseCase creates a new UserUseCase
func NewUserUseCase(userRepo *repositories.UserRepository) *UserUseCase {
	return &UserUseCase{
		userRepo: userRepo,
	}
}

// GetUserByID retrieves a user by ID
func (uc *UserUseCase) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	return uc.userRepo.GetByID(ctx, id)
}

// UpdateUserProfile updates a user's basic profile information
func (uc *UserUseCase) UpdateUserProfile(ctx context.Context, user *entities.User) error {
	// Check if user exists
	existingUser, err := uc.userRepo.GetByID(ctx, user.ID)
	if err != nil {
		return err
	}
	if existingUser == nil {
		return errors.New("user not found")
	}

	return uc.userRepo.Update(ctx, user)
}

// UpdatePassword updates a user's password
func (uc *UserUseCase) UpdatePassword(ctx context.Context, userID int, currentPassword, newPassword string) error {
	// Check if user exists
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Validate current password
	if !user.ValidatePassword(currentPassword) {
		return errors.New("current password is incorrect")
	}

	// Hash the new password
	var newUser entities.User
	if err := newUser.HashPassword(newPassword); err != nil {
		return err
	}

	// Update the password
	return uc.userRepo.UpdatePassword(ctx, userID, newUser.PasswordHash)
}

// DeleteUser deletes a user and all associated data
func (uc *UserUseCase) DeleteUser(ctx context.Context, userID int) error {

	return uc.userRepo.Delete(ctx, userID)
}
