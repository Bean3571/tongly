package repositories

import (
	"context"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

// RatingRepository defines the interface for lesson rating persistence operations
type RatingRepository interface {
	common.Repository[entities.LessonRating]
	GetByLessonID(ctx context.Context, lessonID int) ([]entities.LessonRating, error)
	GetAverageRatingByTutorID(ctx context.Context, tutorID int) (float64, error)
}
