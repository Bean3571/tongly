package interfaces

import (
	"fmt"
	"net/http"
	"strconv"

	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"
	"tongly-backend/pkg/webrtc"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
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

	// Verify lesson is in progress or scheduled
	if lesson.Status != "in_progress" && lesson.Status != "scheduled" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lesson must be in progress or scheduled"})
		return
	}

	// Set WebSocket headers
	c.Writer.Header().Set("Sec-WebSocket-Protocol", "v1.webrtc.tongly")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
	c.Writer.Header().Set("Connection", "Upgrade")
	c.Writer.Header().Set("Upgrade", "websocket")

	// Handle WebSocket connection
	if err := h.signalingServer.HandleConnection(fmt.Sprintf("room_%d", lesson.ID), userID.(int), c.Writer, c.Request); err != nil {
		if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to establish WebSocket connection"})
		}
		return
	}
}
