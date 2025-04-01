package entities

import "time"

// Goal represents a learning goal
type Goal struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// UserGoal represents a user's learning goal
type UserGoal struct {
	UserID    int       `json:"user_id"`
	GoalID    int       `json:"goal_id"`
	Goal      *Goal     `json:"goal,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}
