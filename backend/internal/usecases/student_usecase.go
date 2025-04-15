package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// StudentUseCase handles business logic for students
type StudentUseCase struct {
	studentRepo *repositories.StudentRepository
	userRepo    *repositories.UserRepository
	lessonRepo  *repositories.LessonRepository
}

// NewStudentUseCase creates a new StudentUseCase
func NewStudentUseCase(
	studentRepo *repositories.StudentRepository,
	userRepo *repositories.UserRepository,
	lessonRepo *repositories.LessonRepository,
) *StudentUseCase {
	return &StudentUseCase{
		studentRepo: studentRepo,
		userRepo:    userRepo,
		lessonRepo:  lessonRepo,
	}
}

// GetStudentProfile retrieves a student's profile with all related information
func (uc *StudentUseCase) GetStudentProfile(ctx context.Context, studentID int) (*entities.StudentProfile, error) {
	// Get student profile
	studentProfile, err := uc.studentRepo.GetByUserID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	if studentProfile == nil {
		return nil, errors.New("student profile not found")
	}

	// Get student user information
	user, err := uc.userRepo.GetByID(ctx, studentID)
	if err != nil {
		return nil, err
	}
	studentProfile.User = user

	// Get student languages
	languages, err := uc.studentRepo.GetLanguages(ctx, studentID)
	if err != nil {
		return nil, err
	}
	studentProfile.Languages = languages

	// Get student interests
	interests, err := uc.studentRepo.GetInterests(ctx, studentID)
	if err != nil {
		return nil, err
	}
	studentProfile.Interests = interests

	// Get student goals
	goals, err := uc.studentRepo.GetGoals(ctx, studentID)
	if err != nil {
		return nil, err
	}
	studentProfile.Goals = goals

	return studentProfile, nil
}

// UpdateStudentProfile updates a student's profile information
func (uc *StudentUseCase) UpdateStudentProfile(ctx context.Context, studentID int, req *entities.StudentUpdateRequest) error {
	// Get existing profile
	studentProfile, err := uc.studentRepo.GetByUserID(ctx, studentID)
	if err != nil {
		return err
	}
	if studentProfile == nil {
		return errors.New("student profile not found")
	}

	// Get user to update profile picture
	user, err := uc.userRepo.GetByID(ctx, studentID)
	if err != nil {
		return err
	}

	// Update profile picture if provided
	if req.ProfilePictureURL != "" {
		user.ProfilePictureURL = &req.ProfilePictureURL
		if err := uc.userRepo.Update(ctx, user); err != nil {
			return err
		}
	}

	// Update languages if provided
	if len(req.Languages) > 0 {
		// First get existing languages to determine what to add/remove
		currentLangs, err := uc.studentRepo.GetLanguages(ctx, studentID)
		if err != nil {
			return err
		}

		// Map existing languages for easy lookup
		existingLangs := make(map[int]bool)
		for _, lang := range currentLangs {
			existingLangs[lang.LanguageID] = true
		}

		// Process languages
		for _, langUpdate := range req.Languages {
			// Add or update language
			if err := uc.studentRepo.AddLanguage(ctx, studentID, langUpdate.LanguageID, langUpdate.ProficiencyID); err != nil {
				return err
			}
			// Remove from existing map to track what's been updated
			delete(existingLangs, langUpdate.LanguageID)
		}
	}

	// Update interests if provided
	if len(req.Interests) > 0 {
		// First get existing interests
		currentInterests, err := uc.studentRepo.GetInterests(ctx, studentID)
		if err != nil {
			return err
		}

		// Map existing interests for easy lookup
		existingInterests := make(map[int]bool)
		for _, interest := range currentInterests {
			existingInterests[interest.InterestID] = true
		}

		// Add new interests
		for _, interestID := range req.Interests {
			if !existingInterests[interestID] {
				if err := uc.studentRepo.AddInterest(ctx, studentID, interestID); err != nil {
					return err
				}
			}
			// Remove from existing map
			delete(existingInterests, interestID)
		}
	}

	// Update goals if provided
	if len(req.Goals) > 0 {
		// First get existing goals
		currentGoals, err := uc.studentRepo.GetGoals(ctx, studentID)
		if err != nil {
			return err
		}

		// Map existing goals for easy lookup
		existingGoals := make(map[int]bool)
		for _, goal := range currentGoals {
			existingGoals[goal.GoalID] = true
		}

		// Add new goals
		for _, goalID := range req.Goals {
			if !existingGoals[goalID] {
				if err := uc.studentRepo.AddGoal(ctx, studentID, goalID); err != nil {
					return err
				}
			}
			// Remove from existing map
			delete(existingGoals, goalID)
		}
	}

	return nil
}

// UpdateStreak updates a student's streak information
func (uc *StudentUseCase) UpdateStreak(ctx context.Context, studentID int, increment bool) error {
	// Get existing profile
	studentProfile, err := uc.studentRepo.GetByUserID(ctx, studentID)
	if err != nil {
		return err
	}
	if studentProfile == nil {
		return errors.New("student profile not found")
	}

	if increment {
		// Increment current streak
		studentProfile.CurrentStreak++

		// Update longest streak if needed
		if studentProfile.CurrentStreak > studentProfile.LongestStreak {
			studentProfile.LongestStreak = studentProfile.CurrentStreak
		}
	} else {
		// Reset current streak
		studentProfile.CurrentStreak = 0
	}

	// Save updated profile
	return uc.studentRepo.Update(ctx, studentProfile)
}

// GetUpcomingLessons retrieves upcoming lessons for a student
func (uc *StudentUseCase) GetUpcomingLessons(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetUpcomingLessons(ctx, studentID, true)
}

// GetPastLessons retrieves past lessons for a student
func (uc *StudentUseCase) GetPastLessons(ctx context.Context, studentID int) ([]entities.Lesson, error) {
	return uc.lessonRepo.GetPastLessons(ctx, studentID, true)
}

// AddLanguage adds a language to a student's profile
func (uc *StudentUseCase) AddLanguage(ctx context.Context, studentID int, languageID int, proficiencyID int) error {
	return uc.studentRepo.AddLanguage(ctx, studentID, languageID, proficiencyID)
}

// RemoveLanguage removes a language from a student's profile
func (uc *StudentUseCase) RemoveLanguage(ctx context.Context, studentID int, languageID int) error {
	return uc.studentRepo.RemoveLanguage(ctx, studentID, languageID)
}

// AddInterest adds an interest to a student's profile
func (uc *StudentUseCase) AddInterest(ctx context.Context, studentID int, interestID int) error {
	return uc.studentRepo.AddInterest(ctx, studentID, interestID)
}

// RemoveInterest removes an interest from a student's profile
func (uc *StudentUseCase) RemoveInterest(ctx context.Context, studentID int, interestID int) error {
	return uc.studentRepo.RemoveInterest(ctx, studentID, interestID)
}

// AddGoal adds a goal to a student's profile
func (uc *StudentUseCase) AddGoal(ctx context.Context, studentID int, goalID int) error {
	return uc.studentRepo.AddGoal(ctx, studentID, goalID)
}

// RemoveGoal removes a goal from a student's profile
func (uc *StudentUseCase) RemoveGoal(ctx context.Context, studentID int, goalID int) error {
	return uc.studentRepo.RemoveGoal(ctx, studentID, goalID)
}
