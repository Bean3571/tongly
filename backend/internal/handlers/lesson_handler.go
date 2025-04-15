package interfaces

import (
	"net/http"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// LessonHandler handles HTTP requests for lesson-related functionality
type LessonHandler struct {
	lessonUseCase *usecases.LessonUseCase
}

// NewLessonHandler creates a new LessonHandler
func NewLessonHandler(lessonUseCase *usecases.LessonUseCase) *LessonHandler {
	return &LessonHandler{
		lessonUseCase: lessonUseCase,
	}
}

// BookLesson handles the request to book a new lesson
func (h *LessonHandler) BookLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req entities.LessonBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	studentID := userID.(int)
	lesson, err := h.lessonUseCase.BookLesson(c.Request.Context(), studentID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, lesson)
}

// GetLesson handles the request to retrieve a lesson by ID
func (h *LessonHandler) GetLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessonIDStr := c.Param("lessonId")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	lesson, err := h.lessonUseCase.GetLessonByID(c.Request.Context(), lessonID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lesson"})
		return
	}

	// Check if the user is associated with this lesson
	if lesson.StudentID != userID.(int) && lesson.TutorID != userID.(int) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You don't have permission to view this lesson"})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

// CancelLesson handles the request to cancel a lesson
func (h *LessonHandler) CancelLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessonIDStr := c.Param("lessonId")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	type CancelRequest struct {
		Reason string `json:"reason" binding:"required"`
	}

	var req CancelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.lessonUseCase.CancelLesson(c.Request.Context(), lessonID, userID.(int)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lesson cancelled successfully"})
}

// AddReview handles the request to add a review for a lesson
func (h *LessonHandler) AddReview(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessonIDStr := c.Param("lessonId")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	type AddReviewRequest struct {
		Rating int `json:"rating" binding:"required,min=1,max=5"`
	}

	var req AddReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	review, err := h.lessonUseCase.AddReview(c.Request.Context(), lessonID, userID.(int), req.Rating)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GetUserLessons handles the request to retrieve all lessons for the current user
func (h *LessonHandler) GetUserLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user lessons based on their role (student or tutor)
	isStudent := true // Default to student role
	userRole, exists := c.Get("user_role")
	if exists && userRole.(string) == "tutor" {
		isStudent = false
	}

	lessons, err := h.lessonUseCase.GetAllLessonsByUser(c.Request.Context(), userID.(int), isStudent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// GetUserScheduledLessons handles the request to retrieve scheduled lessons for the current user
func (h *LessonHandler) GetUserScheduledLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user role
	isStudent := true
	userRole, exists := c.Get("user_role")
	if exists && userRole.(string) == "tutor" {
		isStudent = false
	}

	lessons, err := h.lessonUseCase.GetUpcomingLessonsByUser(c.Request.Context(), userID.(int), isStudent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve scheduled lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// GetUserPastLessons handles the request to retrieve past lessons for the current user
func (h *LessonHandler) GetUserPastLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user role
	isStudent := true
	userRole, exists := c.Get("user_role")
	if exists && userRole.(string) == "tutor" {
		isStudent = false
	}

	lessons, err := h.lessonUseCase.GetPastLessonsByUser(c.Request.Context(), userID.(int), isStudent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve past lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// GetUserCancelledLessons handles the request to retrieve cancelled lessons for the current user
func (h *LessonHandler) GetUserCancelledLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user role
	isStudent := true
	userRole, exists := c.Get("user_role")
	if exists && userRole.(string) == "tutor" {
		isStudent = false
	}

	lessons, err := h.lessonUseCase.GetCancelledLessonsByUser(c.Request.Context(), userID.(int), isStudent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve cancelled lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// RegisterRoutes registers the lesson routes
func (h *LessonHandler) RegisterRoutes(router *gin.Engine) {
	lessons := router.Group("/api/lessons")
	lessons.Use(middleware.AuthMiddleware())
	{
		lessons.POST("", h.BookLesson)
		lessons.GET("/user", h.GetUserLessons)
		lessons.GET("/user/scheduled", h.GetUserScheduledLessons)
		lessons.GET("/user/past", h.GetUserPastLessons)
		lessons.GET("/user/cancelled", h.GetUserCancelledLessons)
		lessons.GET("/:lessonId", h.GetLesson)
		lessons.POST("/:lessonId/cancel", h.CancelLesson)
		lessons.POST("/:lessonId/reviews", h.AddReview)
	}
}
