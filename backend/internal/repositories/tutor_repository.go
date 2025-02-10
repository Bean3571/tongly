package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// TutorRepository defines the interface for tutor-related database operations
type TutorRepository interface {
	// Tutor Details operations
	GetTutorByID(ctx context.Context, tutorID int) (*entities.TutorDetails, error)
	CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error
	GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error)
	UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error
	ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.User, error)
	UpdateTutorApprovalStatus(ctx context.Context, userID int, approved bool) error

	// Profile operations
	CreateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error
	GetTutorProfile(ctx context.Context, tutorID int) (*entities.TutorProfile, error)
	UpdateTutorProfile(ctx context.Context, profile *entities.TutorProfile) error
}
