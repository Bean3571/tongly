package usecases

import (
	"context"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// AuthUseCase handles authentication business logic
type AuthUseCase struct {
	userRepo    *repositories.UserRepository
	studentRepo *repositories.StudentRepository
	tutorRepo   *repositories.TutorRepository
}

// NewAuthUseCase creates a new AuthUseCase
func NewAuthUseCase(
	userRepo *repositories.UserRepository,
	studentRepo *repositories.StudentRepository,
	tutorRepo *repositories.TutorRepository,
) *AuthUseCase {
	return &AuthUseCase{
		userRepo:    userRepo,
		studentRepo: studentRepo,
		tutorRepo:   tutorRepo,
	}
}

// Register creates a new user with the appropriate role
func (uc *AuthUseCase) Register(ctx context.Context, username, email, password, role string) (*entities.User, error) {
	// Check if username already exists
	existingUser, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("username already exists")
	}

	// Check if email already exists
	existingUser, err = uc.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("email already exists")
	}

	// Create new user
	user := &entities.User{
		Username: username,
		Email:    email,
		Role:     role,
		// Default values for required fields
		FirstName: "",
		LastName:  "",
	}

	// Hash password
	if err := user.HashPassword(password); err != nil {
		return nil, err
	}

	// Save user to database
	if err := uc.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	// Create corresponding profile based on role
	if role == "student" {
		studentProfile := &entities.StudentProfile{
			UserID:        user.ID,
			CurrentStreak: 0,
			LongestStreak: 0,
		}
		if err := uc.studentRepo.Create(ctx, studentProfile); err != nil {
			// If profile creation fails, log error
			return nil, errors.New("failed to create student profile: " + err.Error())
		}
	} else if role == "tutor" {
		tutorProfile := &entities.TutorProfile{
			UserID:          user.ID,
			Bio:             "",
			Education:       []map[string]string{},
			YearsExperience: 0,
		}
		if err := uc.tutorRepo.Create(ctx, tutorProfile); err != nil {
			// If profile creation fails, log error
			return nil, errors.New("failed to create tutor profile: " + err.Error())
		}
	}

	return user, nil
}

// Authenticate checks user credentials and returns the user if valid
func (uc *AuthUseCase) Authenticate(ctx context.Context, username, password string) (*entities.User, error) {
	user, err := uc.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.ValidatePassword(password) {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}

// GetUserByID retrieves a user by ID
func (uc *AuthUseCase) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	return uc.userRepo.GetByID(ctx, id)
}

// RegisterStudent registers a new student with additional profile information
func (uc *AuthUseCase) RegisterStudent(ctx context.Context, req *entities.StudentRegistrationRequest) (*entities.User, error) {
	// Register the base user first
	user, err := uc.Register(ctx, req.Username, req.Email, req.Password, "student")
	if err != nil {
		return nil, err
	}

	// Add languages if provided
	for _, lang := range req.Languages {
		if err := uc.studentRepo.AddLanguage(ctx, user.ID, lang.LanguageID, lang.ProficiencyID); err != nil {
			return nil, err
		}
	}

	// Add interests if provided
	for _, interestID := range req.Interests {
		if err := uc.studentRepo.AddInterest(ctx, user.ID, interestID); err != nil {
			return nil, err
		}
	}

	// Add goals if provided
	for _, goalID := range req.Goals {
		if err := uc.studentRepo.AddGoal(ctx, user.ID, goalID); err != nil {
			return nil, err
		}
	}

	return user, nil
}

// RegisterTutor registers a new tutor with additional profile information
func (uc *AuthUseCase) RegisterTutor(ctx context.Context, req *entities.TutorRegistrationRequest) (*entities.User, error) {
	// Register the base user first
	user, err := uc.Register(ctx, req.Username, req.Email, req.Password, "tutor")
	if err != nil {
		return nil, err
	}

	// Update tutor profile with additional information
	tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, user.ID)
	if err != nil {
		return nil, err
	}

	tutorProfile.Bio = req.Bio
	tutorProfile.Education = req.Education
	tutorProfile.IntroVideoURL = req.IntroVideoURL
	tutorProfile.YearsExperience = req.YearsExperience

	if err := uc.tutorRepo.Update(ctx, tutorProfile); err != nil {
		return nil, err
	}

	// Add languages if provided
	for _, lang := range req.Languages {
		if err := uc.studentRepo.AddLanguage(ctx, user.ID, lang.LanguageID, lang.ProficiencyID); err != nil {
			return nil, err
		}
	}

	return user, nil
}

// GetUserProfile retrieves the complete user profile (including role-specific data)
func (uc *AuthUseCase) GetUserProfile(ctx context.Context, userID int) (interface{}, error) {
	// Get base user info
	user, err := uc.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Based on role, get additional profile info
	if user.Role == "student" {
		studentProfile, err := uc.studentRepo.GetByUserID(ctx, userID)
		if err != nil {
			return nil, err
		}

		// Get languages
		languages, err := uc.studentRepo.GetLanguages(ctx, userID)
		if err != nil {
			return nil, err
		}

		// Get interests
		interests, err := uc.studentRepo.GetInterests(ctx, userID)
		if err != nil {
			return nil, err
		}

		// Get goals
		goals, err := uc.studentRepo.GetGoals(ctx, userID)
		if err != nil {
			return nil, err
		}

		studentProfile.User = user
		studentProfile.Languages = languages
		studentProfile.Interests = interests
		studentProfile.Goals = goals

		return studentProfile, nil
	} else if user.Role == "tutor" {
		tutorProfile, err := uc.tutorRepo.GetByUserID(ctx, userID)
		if err != nil {
			return nil, err
		}

		// Get languages
		languages, err := uc.studentRepo.GetLanguages(ctx, userID)
		if err != nil {
			return nil, err
		}

		tutorProfile.User = user
		tutorProfile.Languages = languages

		return tutorProfile, nil
	}

	return user, nil
}
