package interfaces

import (
	"net/http"
	"strconv"

	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"
	"tongly-backend/pkg/webrtc"

	"github.com/gin-gonic/gin"
)

type WebRTCHandler struct {
	lessonUseCase   usecases.LessonUseCase
	signalingServer *webrtc.SignalingServer
}

func NewWebRTCHandler(lessonUseCase usecases.LessonUseCase) *WebRTCHandler {
	return &WebRTCHandler{
		lessonUseCase:   lessonUseCase,
		signalingServer: webrtc.NewSignalingServer(),
	}
}

func (h *WebRTCHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/lessons/:id/rtc", middleware.AuthMiddleware(), h.handleWebRTC)
}

func (h *WebRTCHandler) handleWebRTC(c *gin.Context) {
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

	// Verify user has access to the lesson
	lesson, err := h.lessonUseCase.GetLessonByID(c.Request.Context(), userID.(int), lessonID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify lesson is in progress
	if lesson.Status != "in_progress" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lesson is not in progress"})
		return
	}

	// Get or create video session
	session, err := h.lessonUseCase.GetVideoSession(c.Request.Context(), lessonID, userID.(int))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video session not found"})
		return
	}

	// Handle WebSocket connection
	if err := h.signalingServer.HandleConnection(session.RoomID, userID.(int), c.Writer, c.Request); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to establish WebSocket connection"})
		return
	}
}
