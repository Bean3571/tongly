package usecases

import (
	"errors"
	"tongly-basic/backend/internal/entities"
	"tongly-basic/backend/internal/logger"
	"tongly-basic/backend/internal/repositories"
)

type UserUseCase struct {
	UserRepo repositories.UserRepository
}

func NewUserUseCase(userRepo repositories.UserRepository) *UserUseCase {
	return &UserUseCase{
		UserRepo: userRepo,
	}
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

	// Check if this is a survey update (only if survey fields are provided and other fields are empty)
	isSurveyUpdate := (updateData.NativeLanguage != nil || len(updateData.Languages) > 0 ||
		len(updateData.Interests) > 0 || len(updateData.LearningGoals) > 0) &&
		updateData.Email == "" && updateData.FirstName == nil && updateData.LastName == nil &&
		updateData.ProfilePicture == nil && updateData.Age == nil && updateData.Gender == nil

	if isSurveyUpdate {
		nativeLanguage := ""
		if updateData.NativeLanguage != nil {
			nativeLanguage = *updateData.NativeLanguage
		}
		return uc.UserRepo.UpdateSurvey(
			userID,
			nativeLanguage,
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
	if updateData.Age != nil {
		user.Age = updateData.Age
	}
	if updateData.Gender != nil {
		user.Gender = updateData.Gender
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
