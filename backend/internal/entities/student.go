package entities

import "time"

// StudentProfile represents a student's profile information
type StudentProfile struct {
	UserID        int       `json:"user_id"`
	CurrentStreak int       `json:"current_streak"`
	LongestStreak int       `json:"longest_streak"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	// Related entities (not in the database)
	User      *User          `json:"user,omitempty"`
	Languages []UserLanguage `json:"languages,omitempty"`
	Interests []UserInterest `json:"interests,omitempty"`
	Goals     []UserGoal     `json:"goals,omitempty"`
}

// StudentRegistrationRequest represents the data needed to register as a student
type StudentRegistrationRequest struct {
	// Basic user registration data
	Username     string `json:"username" validate:"required"`
	PasswordHash string `json:"password_hash" validate:"required"`
	Email        string `json:"email" validate:"required,email"`

	// Student-specific data (optional)
	Languages []UserLanguageUpdate `json:"languages,omitempty"`
	Interests []int                `json:"interests,omitempty"`
	Goals     []int                `json:"goals,omitempty"`
}

// StudentUpdateRequest represents the data needed to update a student's profile
type StudentUpdateRequest struct {
	ProfilePictureURL *string              `json:"profile_picture_url,omitempty"`
	Languages         []UserLanguageUpdate `json:"languages,omitempty"`
	Interests         []int                `json:"interests,omitempty"`
	Goals             []int                `json:"goals,omitempty"`
}
