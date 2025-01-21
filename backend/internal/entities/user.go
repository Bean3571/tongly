package entities

import "golang.org/x/crypto/bcrypt"

type User struct {
	ID             int    `json:"id"`
	Username       string `json:"username"`
	PasswordHash   string `json:"-"`
	Role           string `json:"role"`
	Email          string `json:"email"`
	ProfilePicture string `json:"profile_picture"`
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
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)) == nil
}
