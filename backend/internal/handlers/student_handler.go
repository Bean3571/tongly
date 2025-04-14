package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// StudentHandler handles HTTP requests for student-related functionality
type StudentHandler struct {
	studentUseCase *usecases.StudentUseCase
}

// NewStudentHandler creates a new StudentHandler
func NewStudentHandler(studentUseCase *usecases.StudentUseCase) *StudentHandler {
	return &StudentHandler{
		studentUseCase: studentUseCase,
	}
}

// GetProfile handles the request to retrieve a student's profile
func (h *StudentHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	studentID := userID.(int)
	profile, err := h.studentUseCase.GetStudentProfile(c.Request.Context(), studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile handles the request to update a student's profile
func (h *StudentHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req entities.StudentUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.UpdateStudentProfile(c.Request.Context(), studentID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// UpdateStreak handles the request to update a student's streak
func (h *StudentHandler) UpdateStreak(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	type UpdateStreakRequest struct {
		Increment bool `json:"increment"`
	}

	var req UpdateStreakRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.UpdateStreak(c.Request.Context(), studentID, req.Increment); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update streak"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Streak updated successfully"})
}

// GetUpcomingLessons handles the request to retrieve upcoming lessons for a student
func (h *StudentHandler) GetUpcomingLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	studentID := userID.(int)
	lessons, err := h.studentUseCase.GetUpcomingLessons(c.Request.Context(), studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// GetPastLessons handles the request to retrieve past lessons for a student
func (h *StudentHandler) GetPastLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	studentID := userID.(int)
	lessons, err := h.studentUseCase.GetPastLessons(c.Request.Context(), studentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// RegisterRoutes registers the student routes
func (h *StudentHandler) RegisterRoutes(router *gin.Engine) {
	student := router.Group("/api/student")
	student.Use(middleware.AuthMiddleware())
	{
		student.GET("/profile", h.GetProfile)
		student.PUT("/profile", h.UpdateProfile)
		student.POST("/streak", h.UpdateStreak)
		student.GET("/lessons/upcoming", h.GetUpcomingLessons)
		student.GET("/lessons/past", h.GetPastLessons)
	}
}
