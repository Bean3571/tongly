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

func NewLessonHandler(lessonUseCase usecases.LessonUseCase) *LessonHandler {
	return &LessonHandler{
		lessonUseCase: lessonUseCase,
	}
}

func (h *LessonHandler) RegisterRoutes(r *gin.Engine) {
	lessons := r.Group("/api/lessons")
	{
		// Lesson management
		lessons.POST("", middleware.AuthMiddleware(), h.bookLesson)
		lessons.GET("/:id", middleware.AuthMiddleware(), h.getLesson)
		lessons.POST("/:id/cancel", middleware.AuthMiddleware(), h.cancelLesson)
		lessons.GET("/upcoming", middleware.AuthMiddleware(), h.getUpcomingLessons)
		lessons.GET("/completed", middleware.AuthMiddleware(), h.getCompletedLessons)

		// Video session
		lessons.POST("/:id/video/start", middleware.AuthMiddleware(), h.startVideoSession)
		lessons.POST("/:id/video/end", middleware.AuthMiddleware(), h.endVideoSession)
		lessons.GET("/:id/video", middleware.AuthMiddleware(), h.getVideoSession)

		// Chat
		lessons.POST("/:id/chat", middleware.AuthMiddleware(), h.sendChatMessage)
		lessons.GET("/:id/chat", middleware.AuthMiddleware(), h.getChatHistory)

		// Ratings
		lessons.POST("/:id/rate", middleware.AuthMiddleware(), h.rateLesson)
	}
	r.GET("/api/tutors/:id/rating", h.getTutorRating)
}

func (h *LessonHandler) bookLesson(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lesson)
}

func (h *LessonHandler) getLesson(c *gin.Context) {
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

func (h *LessonHandler) cancelLesson(c *gin.Context) {
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

func (h *LessonHandler) getUpcomingLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	role := c.GetString("user_role")

	lessons, err := h.lessonUseCase.GetUpcomingLessons(c.Request.Context(), userID.(int), role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) getCompletedLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	role := c.GetString("user_role")

	lessons, err := h.lessonUseCase.GetCompletedLessons(c.Request.Context(), userID.(int), role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

func (h *LessonHandler) startVideoSession(c *gin.Context) {
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

	session, err := h.lessonUseCase.StartVideoSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *LessonHandler) endVideoSession(c *gin.Context) {
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

	if err := h.lessonUseCase.EndVideoSession(c.Request.Context(), lessonID, userID.(int)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Video session ended successfully"})
}

func (h *LessonHandler) getVideoSession(c *gin.Context) {
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

	session, err := h.lessonUseCase.GetVideoSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

func (h *LessonHandler) sendChatMessage(c *gin.Context) {
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

func (h *LessonHandler) getChatHistory(c *gin.Context) {
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

func (h *LessonHandler) rateLesson(c *gin.Context) {
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

func (h *LessonHandler) getTutorRating(c *gin.Context) {
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
