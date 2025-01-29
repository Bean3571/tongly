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

	// Update user fields
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

	// Only update survey-related fields if explicitly provided
	isSurveyUpdate := updateData.NativeLanguage != nil ||
		updateData.Languages != nil ||
		updateData.Interests != nil ||
		updateData.LearningGoals != nil

	if isSurveyUpdate {
		if updateData.NativeLanguage != nil {
			user.NativeLanguage = updateData.NativeLanguage
		}
		if updateData.Languages != nil {
			user.Languages = updateData.Languages
		}
		if updateData.Interests != nil {
			user.Interests = updateData.Interests
		}
		if updateData.LearningGoals != nil {
			user.LearningGoals = updateData.LearningGoals
		}
		if updateData.SurveyComplete != nil {
			user.SurveyComplete = *updateData.SurveyComplete
		}
	}

	logger.Info("Prepared user data for update",
		"user_id", userID,
		"is_survey_update", isSurveyUpdate)

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
