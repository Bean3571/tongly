package usecases

import (
	"context"
	"errors"
	"fmt"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// UserUseCase defines the interface for user-related business logic
type UserUseCase interface {
	GetUserByID(ctx context.Context, id int) (*entities.User, error)
	UpdatePassword(ctx context.Context, userID int, currentPassword, newPassword string) error
	UpdateUser(ctx context.Context, userID int, updateData entities.UserUpdateRequest) error
}

// userUseCaseImpl implements the UserUseCase interface
type userUseCaseImpl struct {
	userRepo repositories.UserRepository
}

// NewUserUseCase creates a new UserUseCase instance
func NewUserUseCase(userRepo repositories.UserRepository) UserUseCase {
	return &userUseCaseImpl{
		userRepo: userRepo,
	}
}

// GetUserByID retrieves a user by their ID
func (uc *userUseCaseImpl) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	return uc.userRepo.GetUserByID(ctx, id)
}

// UpdatePassword updates a user's password after validating the current password
func (uc *userUseCaseImpl) UpdatePassword(ctx context.Context, userID int, currentPassword, newPassword string) error {
	// Log start of password update operation
	fmt.Printf("Starting password update for user ID: %d\n", userID)

	user, err := uc.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		fmt.Printf("Error fetching user for password update: %v\n", err)
		return err
	}

	// Validate the current password
	if !user.ValidatePassword(currentPassword) {
		fmt.Printf("Password validation failed for user ID: %d\n", userID)
		return errors.New("current password is incorrect")
	}

	// Hash the new password
	if err := user.HashPassword(newPassword); err != nil {
		fmt.Printf("Error hashing new password: %v\n", err)
		return err
	}

	fmt.Printf("Attempting to update password in database for user ID: %d\n", userID)
	// Update the user in the database
	err = uc.userRepo.UpdateUser(ctx, user)
	if err != nil {
		fmt.Printf("Database update failed: %v\n", err)
		return err
	}

	fmt.Printf("Password successfully updated for user ID: %d\n", userID)
	return nil
}

// UpdateUser updates a user's profile information
func (uc *userUseCaseImpl) UpdateUser(ctx context.Context, userID int, updateData entities.UserUpdateRequest) error {
	user, err := uc.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	// Update user fields based on the request data
	if updateData.Email != "" {
		user.Email = updateData.Email
	}

	if updateData.FirstName != nil {
		user.FirstName = *updateData.FirstName
	}

	if updateData.LastName != nil {
		user.LastName = *updateData.LastName
	}

	if updateData.ProfilePictureURL != nil {
		user.ProfilePictureURL = updateData.ProfilePictureURL
	}

	if updateData.Age != nil {
		user.Age = updateData.Age
	}

	if updateData.Sex != nil {
		user.Sex = updateData.Sex
	}

	// Update the user in the database
	return uc.userRepo.UpdateUser(ctx, user)
}
