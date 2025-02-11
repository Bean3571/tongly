package repositories

import (
	"context"

	"tongly-backend/internal/entities"
)

type LessonRepository interface {
	// Lesson management
	CreateLesson(ctx context.Context, lesson *entities.Lesson) error
	GetLesson(ctx context.Context, id int) (*entities.Lesson, error)
	UpdateLesson(ctx context.Context, lesson *entities.Lesson) error
	DeleteLesson(ctx context.Context, id int) error

	// Lesson queries
	GetUpcomingLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetCompletedLessons(ctx context.Context, userID int) ([]entities.Lesson, error)
	GetLessonsByTutor(ctx context.Context, tutorID int) ([]entities.Lesson, error)

	// Video session management
	CreateVideoSession(ctx context.Context, session *entities.VideoSession) error
	StartVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error
	EndVideoSession(ctx context.Context, lesson *entities.Lesson, session *entities.VideoSession) error
	GetVideoSession(ctx context.Context, lessonID int) (*entities.VideoSession, error)
	UpdateVideoSession(ctx context.Context, session *entities.VideoSession) error

	// Chat messages
	SaveChatMessage(ctx context.Context, message *entities.ChatMessage) error
	GetChatHistory(ctx context.Context, lessonID int) ([]*entities.ChatMessage, error)

	// Ratings
	SaveLessonRating(ctx context.Context, rating *entities.LessonRating) error
	GetLessonRating(ctx context.Context, lessonID int) (*entities.LessonRating, error)
	GetTutorAverageRating(ctx context.Context, tutorID int) (float64, error)
}
