package usecases

import (
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
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
	if updateData.NativeLanguage != nil || len(updateData.Languages) > 0 ||
		len(updateData.Interests) > 0 || len(updateData.LearningGoals) > 0 {
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

	// Update user data if email is provided
	if updateData.Email != "" {
		user.Email = updateData.Email
		if err := uc.UserRepo.UpdateUser(*user); err != nil {
			logger.Error("Failed to update user data",
				"error", err,
				"user_id", userID)
			return err
		}
	}

	// Get or create profile
	profile, err := uc.UserRepo.GetProfileByUserID(userID)
	if err != nil {
		logger.Error("Failed to get user profile",
			"error", err,
			"user_id", userID)
		return err
	}

	if profile == nil {
		// Create new profile
		profile = &entities.UserProfile{
			UserID: userID,
		}
	}

	// Update profile fields
	if updateData.FirstName != nil {
		profile.FirstName = updateData.FirstName
	}
	if updateData.LastName != nil {
		profile.LastName = updateData.LastName
	}
	if updateData.ProfilePicture != nil {
		profile.ProfilePicture = updateData.ProfilePicture
	}
	if updateData.Age != nil {
		profile.Age = updateData.Age
	}
	if updateData.Sex != nil {
		profile.Sex = updateData.Sex
	}
	if updateData.NativeLanguage != nil {
		profile.NativeLanguage = updateData.NativeLanguage
	}
	if len(updateData.Languages) > 0 {
		profile.Languages = updateData.Languages
	}
	if len(updateData.Interests) > 0 {
		profile.Interests = updateData.Interests
	}
	if len(updateData.LearningGoals) > 0 {
		profile.LearningGoals = updateData.LearningGoals
	}
	if updateData.SurveyComplete != nil {
		profile.SurveyComplete = *updateData.SurveyComplete
	}

	// Create or update profile
	if profile.ID == 0 {
		err = uc.UserRepo.CreateProfile(*profile)
	} else {
		err = uc.UserRepo.UpdateProfile(*profile)
	}

	if err != nil {
		logger.Error("Failed to update profile",
			"error", err,
			"user_id", userID)
		return err
	}

	logger.Info("User and profile update completed successfully",
		"user_id", userID)
	return nil
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
