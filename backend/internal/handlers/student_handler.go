package interfaces

import (
	"net/http"
	"strconv"
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

// AddLanguage handles the request to add a language to a student's profile
func (h *StudentHandler) AddLanguage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	type AddLanguageRequest struct {
		LanguageID    int `json:"language_id" binding:"required"`
		ProficiencyID int `json:"proficiency_id" binding:"required"`
	}

	var req AddLanguageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.AddLanguage(c.Request.Context(), studentID, req.LanguageID, req.ProficiencyID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add language"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Language added successfully"})
}

// RemoveLanguage handles the request to remove a language from a student's profile
func (h *StudentHandler) RemoveLanguage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	languageIDStr := c.Param("languageId")
	languageID, err := strconv.Atoi(languageIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language ID"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.RemoveLanguage(c.Request.Context(), studentID, languageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove language"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Language removed successfully"})
}

// AddInterest handles the request to add an interest to a student's profile
func (h *StudentHandler) AddInterest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	type AddInterestRequest struct {
		InterestID int `json:"interest_id" binding:"required"`
	}

	var req AddInterestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.AddInterest(c.Request.Context(), studentID, req.InterestID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add interest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interest added successfully"})
}

// RemoveInterest handles the request to remove an interest from a student's profile
func (h *StudentHandler) RemoveInterest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	interestIDStr := c.Param("interestId")
	interestID, err := strconv.Atoi(interestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interest ID"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.RemoveInterest(c.Request.Context(), studentID, interestID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove interest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interest removed successfully"})
}

// AddGoal handles the request to add a goal to a student's profile
func (h *StudentHandler) AddGoal(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	type AddGoalRequest struct {
		GoalID int `json:"goal_id" binding:"required"`
	}

	var req AddGoalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.AddGoal(c.Request.Context(), studentID, req.GoalID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add goal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal added successfully"})
}

// RemoveGoal handles the request to remove a goal from a student's profile
func (h *StudentHandler) RemoveGoal(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	goalIDStr := c.Param("goalId")
	goalID, err := strconv.Atoi(goalIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid goal ID"})
		return
	}

	studentID := userID.(int)
	if err := h.studentUseCase.RemoveGoal(c.Request.Context(), studentID, goalID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove goal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal removed successfully"})
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
		student.POST("/languages", h.AddLanguage)
		student.DELETE("/languages/:languageId", h.RemoveLanguage)
		student.POST("/interests", h.AddInterest)
		student.DELETE("/interests/:interestId", h.RemoveInterest)
		student.POST("/goals", h.AddGoal)
		student.DELETE("/goals/:goalId", h.RemoveGoal)
	}
}
