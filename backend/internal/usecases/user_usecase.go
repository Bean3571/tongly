package usecases

import (
	"context"
	"errors"
	"fmt"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

type UserUseCase interface {
	GetUserByID(ctx context.Context, id int) (*entities.User, error)
	UpdateUserProfile(ctx context.Context, user *entities.User) error
	UpdatePassword(ctx context.Context, userID int, currentPassword, newPassword string) error
	UpdateUser(ctx context.Context, userID int, updateData entities.UserUpdateRequest) error
}

type userUseCaseImpl struct {
	userRepo repositories.UserRepository
}

func NewUserUseCase(userRepo repositories.UserRepository) UserUseCase {
	return &userUseCaseImpl{
		userRepo: userRepo,
	}
}

func (uc *userUseCaseImpl) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	return uc.userRepo.GetUserByID(ctx, id)
}

func (uc *userUseCaseImpl) UpdateUserProfile(ctx context.Context, user *entities.User) error {
	// Update user credentials if changed
	if err := uc.userRepo.UpdateUserCredentials(ctx, *user.Credentials); err != nil {
		return err
	}

	// Update personal info if exists
	if user.Personal != nil {
		if err := uc.userRepo.UpdatePersonalInfo(ctx, *user.Personal); err != nil {
			return err
		}
	}

	// Update role-specific details
	if user.Credentials.Role == "student" && user.Student != nil {
		if err := uc.userRepo.UpdateStudentDetails(ctx, *user.Student); err != nil {
			return err
		}
	} else if user.Credentials.Role == "tutor" && user.Tutor != nil {
		if err := uc.userRepo.UpdateTutorDetails(ctx, user.Tutor); err != nil {
			return err
		}
	}

	return nil
}

func (uc *userUseCaseImpl) UpdateUser(ctx context.Context, userID int, updateData entities.UserUpdateRequest) error {
	logger.Info("Starting user update process",
		"user_id", userID,
		"update_data", updateData)

	user, err := uc.userRepo.GetUserByID(ctx, userID)
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

	// Update user credentials if email is provided
	if updateData.Email != "" {
		user.Credentials.Email = updateData.Email
		if err := uc.userRepo.UpdateUserCredentials(ctx, *user.Credentials); err != nil {
			logger.Error("Failed to update user credentials",
				"error", err,
				"user_id", userID)
			return err
		}
	}

	// Get or create personal info
	personal, err := uc.userRepo.GetPersonalInfo(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user personal info",
			"error", err,
			"user_id", userID)
		return err
	}

	if personal == nil {
		// Create new personal info
		personal = &entities.UserPersonal{
			UserID: userID,
		}
	}

	// Update personal info fields
	if updateData.FirstName != nil {
		personal.FirstName = updateData.FirstName
	}
	if updateData.LastName != nil {
		personal.LastName = updateData.LastName
	}
	if updateData.ProfilePicture != nil {
		personal.ProfilePicture = updateData.ProfilePicture
	}
	if updateData.Age != nil {
		personal.Age = updateData.Age
	}
	if updateData.Sex != nil {
		// Validate sex value against allowed values
		switch *updateData.Sex {
		case "male", "female", "other", "":
			personal.Sex = updateData.Sex
		default:
			return fmt.Errorf("invalid sex value: must be 'male', 'female', or 'other'")
		}
	}

	// Create or update personal info
	if personal.ID == 0 {
		err = uc.userRepo.CreatePersonalInfo(ctx, *personal)
	} else {
		err = uc.userRepo.UpdatePersonalInfo(ctx, *personal)
	}

	if err != nil {
		logger.Error("Failed to update personal info",
			"error", err,
			"user_id", userID)
		return err
	}

	// Handle student details if language or interests are updated
	if len(updateData.Languages) > 0 || len(updateData.Interests) > 0 || len(updateData.LearningGoals) > 0 {
		// Get or create student details
		student, err := uc.userRepo.GetStudentDetails(ctx, userID)
		if err != nil {
			logger.Error("Failed to get student details",
				"error", err,
				"user_id", userID)
			return err
		}

		if student == nil {
			student = &entities.StudentDetails{
				UserID: userID,
			}
		}

		// Update student details
		if len(updateData.Languages) > 0 {
			student.LearningLanguages = updateData.Languages
		}
		if len(updateData.Interests) > 0 {
			student.Interests = updateData.Interests
		}
		if len(updateData.LearningGoals) > 0 {
			student.LearningGoals = updateData.LearningGoals
		}

		// Create or update student details
		if student.ID == 0 {
			err = uc.userRepo.CreateStudentDetails(ctx, *student)
		} else {
			err = uc.userRepo.UpdateStudentDetails(ctx, *student)
		}

		if err != nil {
			logger.Error("Failed to update student details",
				"error", err,
				"user_id", userID)
			return err
		}
	}

	logger.Info("User update completed successfully",
		"user_id", userID)
	return nil
}

func (uc *userUseCaseImpl) UpdatePassword(ctx context.Context, userID int, currentPassword, newPassword string) error {
	user, err := uc.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	if !user.Credentials.ValidatePassword(currentPassword) {
		return errors.New("current password is incorrect")
	}

	if err := user.Credentials.HashPassword(newPassword); err != nil {
		return err
	}

	return uc.userRepo.UpdateUserCredentials(ctx, *user.Credentials)
}
