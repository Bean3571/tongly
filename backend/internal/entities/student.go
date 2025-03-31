package entities

import "time"

// StudentProfile represents a student's profile information
type StudentProfile struct {
	ID                int            `json:"id"`
	UserID            int            `json:"user_id"`
	ProfilePictureURL *string        `json:"profile_picture_url,omitempty"`
	CurrentStreak     int            `json:"current_streak"`
	LongestStreak     int            `json:"longest_streak"`
	LastGameDate      *string        `json:"last_game_date,omitempty"`
	TotalLessonsTaken int            `json:"total_lessons_taken"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	User              *User          `json:"user,omitempty"`
	Languages         []UserLanguage `json:"languages,omitempty"`
	Interests         []UserInterest `json:"interests,omitempty"`
	Goals             []UserGoal     `json:"goals,omitempty"`
}

// StudentUpdateRequest represents the data needed to update a student's profile
type StudentUpdateRequest struct {
	ProfilePictureURL *string              `json:"profile_picture_url,omitempty"`
	Languages         []UserLanguageUpdate `json:"languages,omitempty"`
	Interests         []int                `json:"interests,omitempty"`
	Goals             []int                `json:"goals,omitempty"`
}
