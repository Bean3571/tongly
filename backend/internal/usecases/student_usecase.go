package usecases

import (
	"context"
	"errors"
	"fmt"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
)

// StudentUseCase handles student-related business logic
type StudentUseCase struct {
	StudentRepo repositories.StudentRepository
	UserRepo    repositories.UserRepository
}

// NewStudentUseCase creates a new StudentUseCase instance
func NewStudentUseCase(
	studentRepo repositories.StudentRepository,
	userRepo repositories.UserRepository,
) *StudentUseCase {
	return &StudentUseCase{
		StudentRepo: studentRepo,
		UserRepo:    userRepo,
	}
}

// GetStudentProfile retrieves a student profile
func (uc *StudentUseCase) GetStudentProfile(ctx context.Context, userID int) (*entities.StudentProfile, error) {
	logger.Info("Getting student profile", "user_id", userID)

	// Check if user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return nil, err
	}

	// Get student profile
	profile, err := uc.StudentRepo.GetStudentProfileByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get student profile", "error", err, "user_id", userID)
		return nil, err
	}

	if profile == nil {
		logger.Warn("Student profile not found", "user_id", userID)
		return nil, errors.New("student profile not found")
	}

	logger.Info("Successfully retrieved student profile", "user_id", userID)
	return profile, nil
}

// UpdateStudentProfile updates a student's profile
func (uc *StudentUseCase) UpdateStudentProfile(ctx context.Context, userID int, req *entities.StudentUpdateRequest) error {
	logger.Info("Updating student profile", "user_id", userID)

	// Check if user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return err
	}

	// Get existing profile or create a new one
	profile, err := uc.StudentRepo.GetStudentProfileByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get student profile", "error", err, "user_id", userID)
		return err
	}

	if profile == nil {
		// Create new profile
		profile = &entities.StudentProfile{
			UserID: userID,
		}
	}

	// Update fields if provided
	if req.ProfilePictureURL != nil {
		profile.ProfilePictureURL = req.ProfilePictureURL
	}

	// Update the profile
	err = uc.StudentRepo.UpdateStudentProfile(ctx, profile)
	if err != nil {
		logger.Error("Failed to update student profile", "error", err, "user_id", userID)
		return fmt.Errorf("failed to update student profile: %w", err)
	}

	logger.Info("Successfully updated student profile", "user_id", userID)
	return nil
}

// UpdateStudentStreak updates a student's streak information
func (uc *StudentUseCase) UpdateStudentStreak(ctx context.Context, userID int, currentStreak, longestStreak int, lastGameDate string) error {
	logger.Info("Updating student streak",
		"user_id", userID,
		"current_streak", currentStreak,
		"longest_streak", longestStreak,
		"last_game_date", lastGameDate)

	// Check if user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return err
	}

	// Update streak
	err = uc.StudentRepo.UpdateStudentStreak(ctx, userID, currentStreak, longestStreak, lastGameDate)
	if err != nil {
		logger.Error("Failed to update student streak", "error", err, "user_id", userID)
		return fmt.Errorf("failed to update student streak: %w", err)
	}

	logger.Info("Successfully updated student streak", "user_id", userID)
	return nil
}

// IncrementLessonsTaken increments the number of lessons taken by a student
func (uc *StudentUseCase) IncrementLessonsTaken(ctx context.Context, userID int) error {
	logger.Info("Incrementing lessons taken", "user_id", userID)

	// Check if user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return err
	}

	// Increment lessons taken
	err = uc.StudentRepo.IncrementLessonsTaken(ctx, userID)
	if err != nil {
		logger.Error("Failed to increment lessons taken", "error", err, "user_id", userID)
		return fmt.Errorf("failed to increment lessons taken: %w", err)
	}

	logger.Info("Successfully incremented lessons taken", "user_id", userID)
	return nil
}

// RegisterStudent registers a new student
func (uc *StudentUseCase) RegisterStudent(ctx context.Context, userID int, req *entities.StudentUpdateRequest) error {
	logger.Info("Registering student", "user_id", userID)

	// Check if user exists
	_, err := uc.UserRepo.GetUserByID(ctx, userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err, "user_id", userID)
		return err
	}

	// Create student profile
	profile := &entities.StudentProfile{
		UserID: userID,
	}

	// Apply profile picture if provided
	if req.ProfilePictureURL != nil {
		profile.ProfilePictureURL = req.ProfilePictureURL
	}

	// Create the profile
	err = uc.StudentRepo.CreateStudentProfile(ctx, profile)
	if err != nil {
		logger.Error("Failed to create student profile", "error", err, "user_id", userID)
		return fmt.Errorf("failed to create student profile: %w", err)
	}

	logger.Info("Successfully registered student", "user_id", userID)
	return nil
}
