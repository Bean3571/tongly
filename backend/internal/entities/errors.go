package entities

import "errors"

// Domain errors
var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUsernameExists     = errors.New("username already exists")
	ErrEmailExists        = errors.New("email already exists")
	ErrInvalidRole        = errors.New("invalid role")
	ErrNotFound           = errors.New("resource not found")
)

// TutorNotApprovedError represents an error when booking a lesson with an unapproved tutor
type TutorNotApprovedError struct {
	Message string
	Lesson  *Lesson
}

func (e *TutorNotApprovedError) Error() string {
	return e.Message
}
