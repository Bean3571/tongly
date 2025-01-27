package usecases

import (
	"errors"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/repositories"
)

type UserUseCase struct {
	UserRepo repositories.UserRepository
}

func (uc *UserUseCase) GetUserByID(userID int) (*entities.User, error) {
	return uc.UserRepo.GetUserByID(userID)
}

func (uc *UserUseCase) UpdateUser(userID int, updateData entities.UserUpdateRequest) error {
	user, err := uc.UserRepo.GetUserByID(userID)
	if err != nil {
		return err
	}

	// Update fields
	if updateData.Email != "" {
		user.Email = updateData.Email
	}
	user.ProfilePicture = updateData.ProfilePicture
	user.FirstName = updateData.FirstName
	user.LastName = updateData.LastName

	return uc.UserRepo.UpdateUser(*user)
}

func (uc *UserUseCase) UpdatePassword(userID int, currentPassword, newPassword string) error {
	user, err := uc.UserRepo.GetUserByID(userID)
	if err != nil {
		return err
	}

	if !user.ValidatePassword(currentPassword) {
		return errors.New("current password is incorrect")
	}

	if err := user.HashPassword(newPassword); err != nil {
		return err
	}

	return uc.UserRepo.UpdateUser(*user)
}
