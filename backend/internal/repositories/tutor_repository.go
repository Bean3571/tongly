package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// TutorRepository defines the interface for tutor-related database operations
type TutorRepository interface {
	// Tutor profile operations
	CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error
	GetTutorByID(ctx context.Context, tutorID int) (*entities.TutorProfile, error)
	GetTutorProfileByUserID(ctx context.Context, userID int) (*entities.TutorProfile, error)
	UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error
	UpdateTutorApprovalStatus(ctx context.Context, userID int, approved bool) error

	// Tutor availability operations
	AddTutorAvailability(ctx context.Context, availability *entities.TutorAvailability) error
	GetTutorAvailabilities(ctx context.Context, tutorID int) ([]entities.TutorAvailability, error)
	UpdateTutorAvailability(ctx context.Context, availability *entities.TutorAvailability) error
	RemoveTutorAvailability(ctx context.Context, id int) error

	// Tutor search operations
	ListTutors(ctx context.Context, limit, offset int) ([]entities.TutorProfile, error)
	SearchTutors(ctx context.Context, filters map[string]interface{}) ([]entities.TutorProfile, error)
}
