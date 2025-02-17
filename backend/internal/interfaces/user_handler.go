package interfaces

import (
	"fmt"
	"net/http"
	"path/filepath"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userUseCase usecases.UserUseCase
}

func NewUserHandler(userUseCase usecases.UserUseCase) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
	}
}

func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, user)
}

func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var updateData entities.UserUpdateRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.userUseCase.UpdateUser(c.Request.Context(), userID.(int), updateData); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var passwordData struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := c.ShouldBindJSON(&passwordData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.userUseCase.UpdatePassword(c.Request.Context(), userID.(int), passwordData.CurrentPassword, passwordData.NewPassword); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *UserHandler) UploadProfilePicture(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the file from the request
	file, err := c.FormFile("file")
	if err != nil {
		logger.Error("Failed to get file from request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file type
	if !isValidImageType(file.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only images are allowed"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	newFilename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	uploadPath := filepath.Join("uploads", "avatars", newFilename)

	// Save the file
	if err := c.SaveUploadedFile(file, uploadPath); err != nil {
		logger.Error("Failed to save file",
			"error", err,
			"path", uploadPath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Update user's profile picture URL
	fileURL := fmt.Sprintf("/uploads/avatars/%s", newFilename)
	updateData := entities.UserUpdateRequest{
		ProfilePicture: &fileURL,
	}

	if err := h.userUseCase.UpdateUser(c.Request.Context(), userID.(int), updateData); err != nil {
		logger.Error("Failed to update profile picture",
			"error", err,
			"user_id", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile picture"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url": fileURL,
	})
}

func isValidImageType(filename string) bool {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg", ".png", ".gif":
		return true
	default:
		return false
	}
}
