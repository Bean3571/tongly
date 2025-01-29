package utils

import (
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// RespondWithError sends an error response using Gin
func RespondWithError(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{"error": message})
}

// RespondWithJSON sends a JSON response using Gin
func RespondWithJSON(c *gin.Context, code int, payload interface{}) {
	c.JSON(code, payload)
}

// FormatValidationError formats validation errors into a readable string
func FormatValidationError(err error) string {
	if _, ok := err.(*validator.ValidationErrors); ok {
		return "Validation failed"
	}
	return err.Error()
}
