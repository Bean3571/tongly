package repositories

import (
	"context"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

// LessonRepository defines the interface for lesson persistence operations
type LessonRepository interface {
	// Core CRUD operations
	Create(ctx context.Context, lesson *entities.Lesson) error
	GetByID(ctx context.Context, id int) (*entities.Lesson, error)
	Update(ctx context.Context, lesson *entities.Lesson) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.Lesson, error)

	// Lesson-specific operations
	CreateLesson(ctx context.Context, lesson *entities.Lesson) error
	GetLesson(ctx context.Context, id int) (*entities.Lesson, error)
	GetLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error)
	UpdateLesson(ctx context.Context, lesson *entities.Lesson) error
	DeleteLesson(ctx context.Context, id int) error
	GetByTutorID(ctx context.Context, tutorID int) ([]entities.Lesson, error)
	GetByStudentID(ctx context.Context, studentID int) ([]entities.Lesson, error)
	GetCompletedByUserID(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetUpcomingByUserID(ctx context.Context, userID int) ([]entities.Lesson, error)

	// Status management
	CancelLesson(ctx context.Context, lessonID int) error
}
