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
	lessonUseCase       usecases.LessonUseCase
	videoSessionUseCase usecases.VideoSessionUseCase
}

func NewLessonHandler(
	lessonUseCase usecases.LessonUseCase,
	videoSessionUseCase usecases.VideoSessionUseCase,
) *LessonHandler {
	return &LessonHandler{
		lessonUseCase:       lessonUseCase,
		videoSessionUseCase: videoSessionUseCase,
	}
}

func (h *LessonHandler) RegisterRoutes(r *gin.Engine) {
	lessons := r.Group("/api/lessons")
	{
		// Lesson management
		lessons.POST("", middleware.AuthMiddleware(), h.BookLesson)
		lessons.GET("/:id", middleware.AuthMiddleware(), h.GetLesson)
		lessons.POST("/:id/cancel", middleware.AuthMiddleware(), h.CancelLesson)
		lessons.GET("/upcoming", middleware.AuthMiddleware(), h.GetUpcomingLessons)
		lessons.GET("/completed", middleware.AuthMiddleware(), h.GetCompletedLessons)

		// Video session
		lessons.POST("/:id/video/start", middleware.AuthMiddleware(), h.StartVideoSession)
		lessons.POST("/:id/video/end", middleware.AuthMiddleware(), h.EndVideoSession)
		lessons.GET("/:id/video", middleware.AuthMiddleware(), h.GetVideoSession)

		// Chat
		lessons.POST("/:id/chat", middleware.AuthMiddleware(), h.SendChatMessage)
		lessons.GET("/:id/chat", middleware.AuthMiddleware(), h.GetChatHistory)

		// Ratings
		lessons.POST("/:id/rate", middleware.AuthMiddleware(), h.RateLesson)
	}
	r.GET("/api/tutors/:id/rating", h.GetTutorRating)
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

func (h *LessonHandler) GetUpcomingLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessons, err := h.lessonUseCase.GetUpcomingLessons(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) GetCompletedLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	lessons, err := h.lessonUseCase.GetCompletedLessons(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) StartVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	session, err := h.videoSessionUseCase.StartSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *LessonHandler) EndVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err = h.videoSessionUseCase.EndSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

func (h *LessonHandler) GetVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	session, err := h.videoSessionUseCase.GetSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *LessonHandler) SendChatMessage(c *gin.Context) {
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

	var request struct {
		Content string `json:"content"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.lessonUseCase.SendChatMessage(c.Request.Context(), lessonID, userID.(int), request.Content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Chat message sent successfully"})
}

func (h *LessonHandler) GetChatHistory(c *gin.Context) {
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

	messages, err := h.lessonUseCase.GetChatHistory(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *LessonHandler) RateLesson(c *gin.Context) {
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

	var request struct {
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if err := h.lessonUseCase.RateLesson(c.Request.Context(), lessonID, userID.(int), request.Rating, request.Comment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Lesson rated successfully"})
}

func (h *LessonHandler) GetTutorRating(c *gin.Context) {
	tutorID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	rating, err := h.lessonUseCase.GetTutorRating(c.Request.Context(), tutorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"rating": rating})
}
