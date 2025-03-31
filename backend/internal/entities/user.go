package entities

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID                int       `json:"id"`
	Username          string    `json:"username"`
	Email             string    `json:"email"`
	PasswordHash      string    `json:"-"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	ProfilePictureURL *string   `json:"profile_picture_url,omitempty"`
	Sex               *string   `json:"sex,omitempty"`
	Age               *int      `json:"age,omitempty"`
	Role              string    `json:"role"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Proficiency represents a language proficiency level
type Proficiency struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// UserLanguage represents a user's language proficiency
type UserLanguage struct {
	UserID        int          `json:"user_id"`
	LanguageID    int          `json:"language_id"`
	ProficiencyID int          `json:"proficiency_id"`
	Language      *Language    `json:"language,omitempty"`
	Proficiency   *Proficiency `json:"proficiency,omitempty"`
	CreatedAt     time.Time    `json:"created_at"`
}

// UserInterest represents a user's interest
type UserInterest struct {
	UserID     int       `json:"user_id"`
	InterestID int       `json:"interest_id"`
	Interest   *Interest `json:"interest,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// UserGoal represents a user's learning goal
type UserGoal struct {
	UserID    int       `json:"user_id"`
	GoalID    int       `json:"goal_id"`
	Goal      *Goal     `json:"goal,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// Interest represents an interest category
type Interest struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// Goal represents a learning goal
type Goal struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// HashPassword hashes the user's password using bcrypt
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// ValidatePassword checks if the provided password matches the hashed password
func (u *User) ValidatePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
