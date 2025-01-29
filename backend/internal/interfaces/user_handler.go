package interfaces

import (
	"fmt"
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	UserUseCase usecases.UserUseCase
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Handle both float64 and int types for user ID
	var userIDInt int
	switch v := userID.(type) {
	case float64:
		userIDInt = int(v)
	case int:
		userIDInt = v
	default:
		logger.Error("Invalid user ID type", "user_id_type", fmt.Sprintf("%T", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	user, err := h.UserUseCase.GetUserByID(userIDInt)
	if err != nil {
		logger.Error("Failed to get user profile", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get profile"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Handle both float64 and int types for user ID
	var userIDInt int
	switch v := userID.(type) {
	case float64:
		userIDInt = int(v)
	case int:
		userIDInt = v
	default:
		logger.Error("Invalid user ID type", "user_id_type", fmt.Sprintf("%T", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var updateData entities.UserUpdateRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		logger.Error("Failed to bind update data",
			"error", err,
			"error_type", fmt.Sprintf("%T", err),
			"error_msg", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Log received data
	logger.Info("Received profile update request",
		"user_id", userIDInt,
		"data", updateData)

	if err := h.UserUseCase.UpdateUser(userIDInt, updateData); err != nil {
		logger.Error("Failed to update user profile",
			"error", err,
			"error_type", fmt.Sprintf("%T", err),
			"error_msg", err.Error(),
			"user_id", userIDInt)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Handle both float64 and int types for user ID
	var userIDInt int
	switch v := userID.(type) {
	case float64:
		userIDInt = int(v)
	case int:
		userIDInt = v
	default:
		logger.Error("Invalid user ID type", "user_id_type", fmt.Sprintf("%T", userID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var passwordData struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&passwordData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	if err := h.UserUseCase.UpdatePassword(userIDInt, passwordData.CurrentPassword, passwordData.NewPassword); err != nil {
		logger.Error("Failed to update password", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}
