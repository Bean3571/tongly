package usecases

import (
	"errors"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/logger"
	"tongly/backend/internal/repositories"
)

type UserUseCase struct {
	UserRepo repositories.UserRepository
}

func (uc *UserUseCase) GetUserByID(userID int) (*entities.User, error) {
	return uc.UserRepo.GetUserByID(userID)
}

func (uc *UserUseCase) UpdateUser(userID int, updateData entities.UserUpdateRequest) error {
	logger.Info("Starting user update process",
		"user_id", userID,
		"update_data", updateData)

	user, err := uc.UserRepo.GetUserByID(userID)
	if err != nil {
		logger.Error("Failed to get user for update",
			"error", err,
			"user_id", userID)
		return err
	}
	if user == nil {
		logger.Error("User not found for update",
			"user_id", userID)
		return errors.New("user not found")
	}

	// Check if this is a survey update
	if updateData.NativeLanguage != nil || updateData.Languages != nil ||
		updateData.Interests != nil || updateData.LearningGoals != nil {
		return uc.UserRepo.UpdateSurvey(
			userID,
			*updateData.NativeLanguage,
			updateData.Languages,
			updateData.Interests,
			updateData.LearningGoals,
		)
	}

	// Handle regular profile update
	if updateData.Email != "" {
		user.Email = updateData.Email
	}
	if updateData.FirstName != nil {
		user.FirstName = updateData.FirstName
	}
	if updateData.LastName != nil {
		user.LastName = updateData.LastName
	}
	if updateData.ProfilePicture != nil {
		user.ProfilePicture = updateData.ProfilePicture
	}

	logger.Info("Prepared user data for profile update",
		"user_id", userID,
		"updated_user", user)

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
