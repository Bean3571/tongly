package entities

type UserUpdateRequest struct {
	Email          string  `json:"email"`
	FirstName      *string `json:"first_name,omitempty"`
	LastName       *string `json:"last_name,omitempty"`
	ProfilePicture *string `json:"profile_picture,omitempty"`
}
