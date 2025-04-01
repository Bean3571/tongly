package entities

// UserUpdateRequest represents data for updating a user profile
type UserUpdateRequest struct {
	Username          string  `json:"username,omitempty"`
	Email             string  `json:"email,omitempty"`
	FirstName         string  `json:"first_name,omitempty"`
	LastName          string  `json:"last_name,omitempty"`
	ProfilePictureURL *string `json:"profile_picture_url,omitempty"`
	Sex               *string `json:"sex,omitempty"`
	Age               *int    `json:"age,omitempty"`
}

// UserLanguageUpdate represents a language update with proficiency
type UserLanguageUpdate struct {
	LanguageID    int `json:"language_id"`
	ProficiencyID int `json:"proficiency_id"`
}
