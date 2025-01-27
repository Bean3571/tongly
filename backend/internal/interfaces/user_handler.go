package interfaces

import (
	"net/http"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/logger"
	"tongly/backend/internal/usecases"

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

	// Convert float64 to int
	userIDFloat, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}
	userIDInt := int(userIDFloat)

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

	// Convert float64 to int
	userIDFloat, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}
	userIDInt := int(userIDFloat)

	var updateData entities.UserUpdateRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		logger.Error("Failed to bind update data", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Log received data
	logger.Info("Received profile update request",
		"user_id", userIDInt,
		"data", updateData)

	// Get current user data first
	currentUser, err := h.UserUseCase.GetUserByID(userIDInt)
	if err != nil {
		logger.Error("Failed to get current user data", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Update only provided fields
	if updateData.Email != "" {
		currentUser.Email = updateData.Email
	}
	if updateData.FirstName != nil {
		currentUser.FirstName = updateData.FirstName
	}
	if updateData.LastName != nil {
		currentUser.LastName = updateData.LastName
	}
	if updateData.ProfilePicture != nil {
		currentUser.ProfilePicture = updateData.ProfilePicture
	}

	if err := h.UserUseCase.UpdateUser(userIDInt, updateData); err != nil {
		logger.Error("Failed to update user profile", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
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

	// Convert float64 to int
	userIDFloat, ok := userID.(float64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}
	userIDInt := int(userIDFloat)

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
