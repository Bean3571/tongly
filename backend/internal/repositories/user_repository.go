package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

type UserRepository interface {
	// User Credentials
	CreateUserCredentials(ctx context.Context, creds entities.UserCredentials) error
	GetUserByUsername(ctx context.Context, username string) (*entities.User, error)
	GetUserByID(ctx context.Context, id int) (*entities.User, error)
	UpdateUserCredentials(ctx context.Context, creds entities.UserCredentials) error

	// Personal Information
	CreatePersonalInfo(ctx context.Context, info entities.UserPersonal) error
	GetPersonalInfo(ctx context.Context, userID int) (*entities.UserPersonal, error)
	UpdatePersonalInfo(ctx context.Context, info entities.UserPersonal) error

	// Student Details
	CreateStudentDetails(ctx context.Context, details entities.StudentDetails) error
	GetStudentDetails(ctx context.Context, userID int) (*entities.StudentDetails, error)
	UpdateStudentDetails(ctx context.Context, details entities.StudentDetails) error

	// Tutor Details
	CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error
	GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error)
	UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error
	ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.User, error)
}
