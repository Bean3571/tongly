package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/common"
	"tongly-backend/internal/entities"
)

type ratingRepositoryImpl struct {
	db *sql.DB
}

func NewRatingRepository(db *sql.DB) RatingRepository {
	return &ratingRepositoryImpl{
		db: db,
	}
}

func (r *ratingRepositoryImpl) Create(ctx context.Context, rating *entities.LessonRating) error {
	query := `
		INSERT INTO lesson_ratings (lesson_id, rating, comment, created_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id`

	return r.db.QueryRowContext(ctx, query,
		rating.LessonID, rating.Rating, rating.Comment, rating.CreatedAt,
	).Scan(&rating.ID)
}

func (r *ratingRepositoryImpl) GetByID(ctx context.Context, id int) (*entities.LessonRating, error) {
	query := `
		SELECT id, lesson_id, rating, comment, created_at
		FROM lesson_ratings
		WHERE id = $1`

	rating := &entities.LessonRating{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&rating.ID, &rating.LessonID, &rating.Rating,
		&rating.Comment, &rating.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return rating, err
}

func (r *ratingRepositoryImpl) Update(ctx context.Context, rating *entities.LessonRating) error {
	query := `
		UPDATE lesson_ratings
		SET rating = $1, comment = $2
		WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query,
		rating.Rating, rating.Comment, rating.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ratingRepositoryImpl) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM lesson_ratings WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ratingRepositoryImpl) List(ctx context.Context, pagination common.PaginationParams, filter common.FilterParams) ([]entities.LessonRating, error) {
	// Implement if needed
	return nil, nil
}

func (r *ratingRepositoryImpl) GetByLessonID(ctx context.Context, lessonID int) ([]entities.LessonRating, error) {
	query := `
		SELECT id, lesson_id, rating, comment, created_at
		FROM lesson_ratings
		WHERE lesson_id = $1
		ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, lessonID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ratings []entities.LessonRating
	for rows.Next() {
		var rating entities.LessonRating
		err := rows.Scan(
			&rating.ID, &rating.LessonID, &rating.Rating,
			&rating.Comment, &rating.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		ratings = append(ratings, rating)
	}
	return ratings, nil
}

func (r *ratingRepositoryImpl) GetAverageRatingByTutorID(ctx context.Context, tutorID int) (float64, error) {
	query := `
		SELECT COALESCE(AVG(r.rating), 0)
		FROM lesson_ratings r
		JOIN lessons l ON l.id = r.lesson_id
		WHERE l.tutor_id = $1`

	var avgRating float64
	err := r.db.QueryRowContext(ctx, query, tutorID).Scan(&avgRating)
	if err != nil {
		return 0, err
	}
	return avgRating, nil
}
