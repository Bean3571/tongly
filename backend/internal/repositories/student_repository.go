package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// StudentRepository defines the interface for student-related database operations
type StudentRepository interface {
	// Student profile operations
	CreateStudentProfile(ctx context.Context, profile *entities.StudentProfile) error
	GetStudentByID(ctx context.Context, studentID int) (*entities.StudentProfile, error)
	GetStudentProfileByUserID(ctx context.Context, userID int) (*entities.StudentProfile, error)
	UpdateStudentProfile(ctx context.Context, profile *entities.StudentProfile) error

	// Student streak operations
	UpdateStudentStreak(ctx context.Context, userID int, currentStreak int, longestStreak int, lastGameDate string) error

	// Student lesson operations
	IncrementLessonsTaken(ctx context.Context, userID int) error
}
