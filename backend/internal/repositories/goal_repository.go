package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/entities"
)

// GoalRepository handles database operations for goals
type GoalRepository struct {
	db *sql.DB
}

// NewGoalRepository creates a new GoalRepository
func NewGoalRepository(db *sql.DB) *GoalRepository {
	return &GoalRepository{
		db: db,
	}
}

// GetAllGoals retrieves all goals
func (r *GoalRepository) GetAllGoals(ctx context.Context) ([]entities.Goal, error) {
	query := `
		SELECT id, name, created_at
		FROM goals
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var goals []entities.Goal
	for rows.Next() {
		var goal entities.Goal
		err := rows.Scan(
			&goal.ID,
			&goal.Name,
			&goal.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		goals = append(goals, goal)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return goals, nil
}

// GetGoalByID retrieves a goal by ID
func (r *GoalRepository) GetGoalByID(ctx context.Context, id int) (*entities.Goal, error) {
	query := `
		SELECT id, name, created_at
		FROM goals
		WHERE id = $1
	`

	var goal entities.Goal
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&goal.ID,
		&goal.Name,
		&goal.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &goal, nil
}
