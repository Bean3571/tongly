package interfaces

import (
	"net/http"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// UserHandler handles HTTP requests for user-related functionality
type UserHandler struct {
	userUseCase *usecases.UserUseCase
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(userUseCase *usecases.UserUseCase) *UserHandler {
	return &UserHandler{
		userUseCase: userUseCase,
	}
}

// GetProfile handles the request to retrieve a user's basic profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve profile"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Don't send sensitive information
	user.PasswordHash = ""

	c.JSON(http.StatusOK, user)
}

// UpdateProfile handles the request to update a user's basic profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Only allow updating specific fields
	var req struct {
		FirstName         string  `json:"first_name"`
		LastName          string  `json:"last_name"`
		Email             string  `json:"email"`
		Username          string  `json:"username"`
		ProfilePictureURL *string `json:"profile_picture_url"`
		Sex               *string `json:"sex"`
		Age               *int    `json:"age"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Get existing user
	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update fields if provided
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Sex != nil {
		user.Sex = req.Sex
	}
	if req.Age != nil {
		user.Age = req.Age
	}
	if req.ProfilePictureURL != nil {
		user.ProfilePictureURL = req.ProfilePictureURL
	}

	if err := h.userUseCase.UpdateUserProfile(c.Request.Context(), user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// UpdatePassword handles the request to update a user's password
func (h *UserHandler) UpdatePassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.userUseCase.UpdatePassword(c.Request.Context(), userID.(int), req.CurrentPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password updated successfully"})
}

// DeleteAccount handles the request to delete a user's account
func (h *UserHandler) DeleteAccount(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Verify password first
	user, err := h.userUseCase.GetUserByID(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}
	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if !user.ValidatePassword(req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	if err := h.userUseCase.DeleteUser(c.Request.Context(), userID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted successfully"})
}

// RegisterRoutes registers the user routes
func (h *UserHandler) RegisterRoutes(router *gin.Engine) {
	user := router.Group("/api/user")
	user.Use(middleware.AuthMiddleware())
	{
		user.GET("/profile", h.GetProfile)
		user.PUT("/profile", h.UpdateProfile)
		user.PUT("/password", h.UpdatePassword)
		user.DELETE("/account", h.DeleteAccount)
	}
}
