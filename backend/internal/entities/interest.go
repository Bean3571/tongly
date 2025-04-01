package entities

import "time"

// Interest represents an interest category
type Interest struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// UserInterest represents a user's interest
type UserInterest struct {
	UserID     int       `json:"user_id"`
	InterestID int       `json:"interest_id"`
	Interest   *Interest `json:"interest,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}
