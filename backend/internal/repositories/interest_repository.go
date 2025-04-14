package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/entities"
)

// InterestRepository handles database operations for interests
type InterestRepository struct {
	db *sql.DB
}

// NewInterestRepository creates a new InterestRepository
func NewInterestRepository(db *sql.DB) *InterestRepository {
	return &InterestRepository{
		db: db,
	}
}

// GetAllInterests retrieves all interests
func (r *InterestRepository) GetAllInterests(ctx context.Context) ([]entities.Interest, error) {
	query := `
		SELECT id, name, created_at
		FROM interests
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interests []entities.Interest
	for rows.Next() {
		var interest entities.Interest
		err := rows.Scan(
			&interest.ID,
			&interest.Name,
			&interest.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		interests = append(interests, interest)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return interests, nil
}

// GetInterestByID retrieves an interest by ID
func (r *InterestRepository) GetInterestByID(ctx context.Context, id int) (*entities.Interest, error) {
	query := `
		SELECT id, name, created_at
		FROM interests
		WHERE id = $1
	`

	var interest entities.Interest
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&interest.ID,
		&interest.Name,
		&interest.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &interest, nil
}
