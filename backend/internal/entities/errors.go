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
