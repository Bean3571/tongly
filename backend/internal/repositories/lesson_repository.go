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
	UpdateLessonStatuses(ctx context.Context) error
	CancelLesson(ctx context.Context, lessonID int) error

	// Video session operations
	CreateVideoSession(ctx context.Context, session *entities.VideoSession) error
	GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error)
	UpdateVideoSession(ctx context.Context, session *entities.VideoSession) error
	StartVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error
	EndVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error

	// Chat operations
	SaveChatMessage(ctx context.Context, message *entities.ChatMessage) error
	GetChatHistory(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error)

	// Rating operations
	SaveLessonRating(ctx context.Context, rating *entities.LessonRating) error
	GetLessonRating(ctx context.Context, lessonID int) (*entities.LessonRating, error)
	GetTutorAverageRating(ctx context.Context, tutorID int) (float64, error)
}
