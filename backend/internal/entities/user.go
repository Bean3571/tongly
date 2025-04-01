package entities

import (
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system
type User struct {
	ID                int       `json:"id"`
	Username          string    `json:"username"`
	PasswordHash      string    `json:"password_hash"`
	Email             string    `json:"email"`
	FirstName         string    `json:"first_name"`
	LastName          string    `json:"last_name"`
	ProfilePictureURL *string   `json:"profile_picture_url,omitempty"`
	Sex               *string   `json:"sex,omitempty"`
	Age               *int      `json:"age,omitempty"`
	Role              string    `json:"role"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// UserRegistrationRequest represents data needed for user registration
type UserRegistrationRequest struct {
	Username     string `json:"username" validate:"required"`
	PasswordHash string `json:"password" validate:"required"`
	Email        string `json:"email" validate:"required,email"`
	Role         string `json:"role" validate:"required,oneof=student tutor"`
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
