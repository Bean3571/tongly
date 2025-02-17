package usecases

import (
	"context"
	"time"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
	"tongly-backend/internal/services"
)

// RatingUseCase handles lesson rating operations
type RatingUseCase interface {
	RateLesson(ctx context.Context, lessonID int, studentID int, rating int, comment string) error
	GetTutorRating(ctx context.Context, tutorID int) (float64, error)
	GetLessonRatings(ctx context.Context, lessonID int) ([]entities.LessonRating, error)
}

type ratingUseCase struct {
	lessonRepo   repositories.LessonRepository
	ratingRepo   repositories.RatingRepository
	errorService *services.ErrorService
}

func NewRatingUseCase(
	lessonRepo repositories.LessonRepository,
	ratingRepo repositories.RatingRepository,
	errorService *services.ErrorService,
) RatingUseCase {
	return &ratingUseCase{
		lessonRepo:   lessonRepo,
		ratingRepo:   ratingRepo,
		errorService: errorService,
	}
}

func (uc *ratingUseCase) RateLesson(ctx context.Context, lessonID int, studentID int, rating int, comment string) error {
	lesson, err := uc.lessonRepo.GetByID(ctx, lessonID)
	if err != nil {
		return uc.errorService.WrapError(err, "failed to get lesson")
	}

	if lesson.StudentID != studentID {
		return services.ErrUnauthorized
	}

	if rating < 1 || rating > 5 {
		return services.ErrInvalidInput
	}

	lessonRating := &entities.LessonRating{
		LessonID:  lessonID,
		Rating:    rating,
		Comment:   comment,
		CreatedAt: time.Now(),
	}

	return uc.ratingRepo.Create(ctx, lessonRating)
}

func (uc *ratingUseCase) GetTutorRating(ctx context.Context, tutorID int) (float64, error) {
	return uc.ratingRepo.GetAverageRatingByTutorID(ctx, tutorID)
}

func (uc *ratingUseCase) GetLessonRatings(ctx context.Context, lessonID int) ([]entities.LessonRating, error) {
	return uc.ratingRepo.GetByLessonID(ctx, lessonID)
}
