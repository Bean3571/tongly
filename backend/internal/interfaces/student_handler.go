package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// StudentHandler handles HTTP requests related to students
type StudentHandler struct {
	studentUseCase *usecases.StudentUseCase
}

// NewStudentHandler creates a new StudentHandler instance
func NewStudentHandler(studentUseCase *usecases.StudentUseCase) *StudentHandler {
	return &StudentHandler{
		studentUseCase: studentUseCase,
	}
}

// GetStudentProfile handles the request to get a student's profile
func (h *StudentHandler) GetStudentProfile(c *gin.Context) {
	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Get student profile
	profile, err := h.studentUseCase.GetStudentProfile(c.Request.Context(), userID.(int))
	if err != nil {
		logger.Error("Failed to get student profile", "error", err, "user_id", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get student profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateStudentProfile handles the request to update a student's profile
func (h *StudentHandler) UpdateStudentProfile(c *gin.Context) {
	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse request body
	var req entities.StudentUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Failed to parse request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Update student profile
	err := h.studentUseCase.UpdateStudentProfile(c.Request.Context(), userID.(int), &req)
	if err != nil {
		logger.Error("Failed to update student profile", "error", err, "user_id", userID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update student profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "student profile updated successfully"})
}

// UpdateStudentStreak handles the request to update a student's streak information
func (h *StudentHandler) UpdateStudentStreak(c *gin.Context) {
	// Get user ID from JWT
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// Parse request body
	var req struct {
		CurrentStreak int    `json:"current_streak" binding:"required"`
		LongestStreak int    `json:"longest_streak" binding:"required"`
		LastGameDate  string `json:"last_game_date" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Failed to parse request body", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	// Update student streak
	err := h.studentUseCase.UpdateStudentStreak(
		c.Request.Context(),
		userID.(int),
		req.CurrentStreak,
		req.LongestStreak,
		req.LastGameDate,
	)
	if err != nil {
		logger.Error("Failed to update student streak",
			"error", err,
			"user_id", userID,
			"current_streak", req.CurrentStreak,
			"longest_streak", req.LongestStreak,
			"last_game_date", req.LastGameDate)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update student streak"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "student streak updated successfully"})
}

// RegisterRoutes registers all student routes
func (h *StudentHandler) RegisterRoutes(r *gin.Engine) {
	students := r.Group("/api/students")
	students.Use(middleware.AuthMiddleware())
	{
		students.GET("/me", h.GetStudentProfile)
		students.PUT("/me", h.UpdateStudentProfile)
		students.PATCH("/me/streak", h.UpdateStudentStreak)
	}
}
