package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// TutorRepository defines the interface for tutor-related database operations
type TutorRepository interface {
	CreateTutor(ctx context.Context, tutor *entities.Tutor) error
	GetTutorByID(ctx context.Context, id int) (*entities.Tutor, error)
	GetTutorByUserID(ctx context.Context, userID int) (*entities.Tutor, error)
	ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.Tutor, error)
	UpdateTutorApprovalStatus(ctx context.Context, tutorID int, status string) error
}
