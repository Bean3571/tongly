package interfaces

import (
	"net/http"
	"strconv"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

type LessonHandler struct {
	lessonUseCase usecases.LessonUseCase
}

func NewLessonHandler(
	lessonUseCase usecases.LessonUseCase,
) *LessonHandler {
	return &LessonHandler{
		lessonUseCase: lessonUseCase,
	}
}

func (h *LessonHandler) RegisterRoutes(r *gin.Engine) {
	lessons := r.Group("/api/lessons")
	{

		// Lesson management
		lessons.POST("", middleware.AuthMiddleware(), h.BookLesson)
		lessons.GET("/:id", middleware.AuthMiddleware(), h.GetLesson)
		lessons.POST("/:id/cancel", middleware.AuthMiddleware(), h.CancelLesson)
		lessons.GET("/upcoming", middleware.AuthMiddleware(), h.GetLessons)
		lessons.GET("/completed", middleware.AuthMiddleware(), h.GetLessons)

	}
}

func (h *LessonHandler) BookLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var request entities.LessonBookingRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	lesson, err := h.lessonUseCase.BookLesson(c.Request.Context(), userID.(int), &request)
	if err != nil {
		// Check if it's a TutorNotApprovedError
		if tutorErr, ok := err.(*entities.TutorNotApprovedError); ok {
			// Return a 201 Created status with both the lesson and warning message
			c.JSON(http.StatusCreated, gin.H{
				"lesson":  tutorErr.Lesson,
				"warning": tutorErr.Message,
			})
			return
		}
		// Handle other errors
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func (h *LessonHandler) GetLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	lesson, err := h.lessonUseCase.GetLessonByID(c.Request.Context(), userID.(int), lessonID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func (h *LessonHandler) CancelLesson(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	var request entities.LessonCancellationRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.lessonUseCase.CancelLesson(c.Request.Context(), userID.(int), lessonID, &request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lesson cancelled successfully"})
}

func (h *LessonHandler) GetLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessons, err := h.lessonUseCase.GetLessons(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}
