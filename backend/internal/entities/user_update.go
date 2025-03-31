package entities

// UserUpdateRequest represents data for updating a user profile
type UserUpdateRequest struct {
	// User fields
	Email             string  `json:"email,omitempty"`
	FirstName         *string `json:"first_name,omitempty"`
	LastName          *string `json:"last_name,omitempty"`
	ProfilePictureURL *string `json:"profile_picture_url,omitempty"`
	Age               *int    `json:"age,omitempty"`
	Sex               *string `json:"sex,omitempty"`

	// Language, interest, and goal relationships
	Languages []UserLanguageUpdate `json:"languages,omitempty"`
	Interests []int                `json:"interests,omitempty"`
	Goals     []int                `json:"goals,omitempty"`
}

// UserLanguageUpdate represents a language update with proficiency
type UserLanguageUpdate struct {
	LanguageID    int `json:"language_id"`
	ProficiencyID int `json:"proficiency_id"`
}
