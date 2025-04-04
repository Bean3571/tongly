package entities

// UserUpdateRequest represents data for updating a user profile
type UserUpdateRequest struct {
	FirstName         string  `json:"first_name,omitempty"`
	LastName          string  `json:"last_name,omitempty"`
	Email             string  `json:"email,omitempty"`
	ProfilePictureURL *string `json:"profile_picture_url,omitempty"`
	Sex               string  `json:"sex,omitempty"`
	Age               *int    `json:"age,omitempty"`
}

// PasswordUpdateRequest represents data for updating a user's password
type PasswordUpdateRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required"`
}

// UserLanguageUpdate represents a language update with proficiency
type UserLanguageUpdate struct {
	LanguageID    int `json:"language_id"`
	ProficiencyID int `json:"proficiency_id"`
}
