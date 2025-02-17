package services

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound          = errors.New("resource not found")
	ErrUnauthorized      = errors.New("unauthorized access")
	ErrInvalidInput      = errors.New("invalid input")
	ErrInternalServer    = errors.New("internal server error")
	ErrResourceConflict  = errors.New("resource conflict")
	ErrValidation        = errors.New("validation error")
	ErrResourceExhausted = errors.New("resource exhausted")
)

// ErrorService provides centralized error handling
type ErrorService struct{}

// NewErrorService creates a new ErrorService instance
func NewErrorService() *ErrorService {
	return &ErrorService{}
}

// WrapError wraps an error with additional context
func (s *ErrorService) WrapError(err error, message string) error {
	if err == nil {
		return nil
	}
	return fmt.Errorf("%s: %w", message, err)
}

// IsNotFound checks if the error is a not found error
func (s *ErrorService) IsNotFound(err error) bool {
	return errors.Is(err, ErrNotFound)
}

// IsUnauthorized checks if the error is an unauthorized error
func (s *ErrorService) IsUnauthorized(err error) bool {
	return errors.Is(err, ErrUnauthorized)
}

// IsValidationError checks if the error is a validation error
func (s *ErrorService) IsValidationError(err error) bool {
	return errors.Is(err, ErrValidation)
}

// ToHTTPError converts an error to an HTTP status code and message
func (s *ErrorService) ToHTTPError(err error) (int, string) {
	switch {
	case errors.Is(err, ErrNotFound):
		return 404, "Not Found"
	case errors.Is(err, ErrUnauthorized):
		return 401, "Unauthorized"
	case errors.Is(err, ErrInvalidInput):
		return 400, "Bad Request"
	case errors.Is(err, ErrResourceConflict):
		return 409, "Conflict"
	case errors.Is(err, ErrValidation):
		return 422, "Unprocessable Entity"
	default:
		return 500, "Internal Server Error"
	}
}
