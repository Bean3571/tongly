package interfaces

import (
	"net/http"
	"strconv"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

type VideoCallHandler struct {
	videoCallUseCase *usecases.VideoCallUseCase
}

func NewVideoCallHandler(videoCallUseCase *usecases.VideoCallUseCase) *VideoCallHandler {
	return &VideoCallHandler{
		videoCallUseCase: videoCallUseCase,
	}
}

// InitializeVideoSession initializes a video call session for a lesson
func (h *VideoCallHandler) InitializeVideoSession(c *gin.Context) {
	lessonIDStr := c.Param("id")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	// Get user ID from context (assuming middleware sets this)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Initialize video session
	lesson, err := h.videoCallUseCase.InitializeVideoSession(lessonID)
	if err != nil {
		if err == entities.ErrNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Determine which token to return based on user role
	var token string
	userIDInt := userID.(int)
	if userIDInt == lesson.StudentID && lesson.JoinTokenStudent != nil {
		token = *lesson.JoinTokenStudent
	} else if userIDInt == lesson.TutorID && lesson.JoinTokenTutor != nil {
		token = *lesson.JoinTokenTutor
	} else {
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not allowed to join this lesson"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": *lesson.SessionID,
		"token":      token,
		"lesson_id":  lesson.ID,
		"student": map[string]interface{}{
			"id":         lesson.StudentID,
			"first_name": lesson.Student.FirstName,
			"last_name":  lesson.Student.LastName,
		},
		"tutor": map[string]interface{}{
			"id":         lesson.TutorID,
			"first_name": lesson.Tutor.FirstName,
			"last_name":  lesson.Tutor.LastName,
		},
	})
}

// LogVideoCallEvent logs a video call event
func (h *VideoCallHandler) LogVideoCallEvent(c *gin.Context) {
	lessonIDStr := c.Param("id")
	lessonID, err := strconv.Atoi(lessonIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var eventRequest struct {
		EventType string                 `json:"event_type" binding:"required"`
		EventData map[string]interface{} `json:"event_data"`
	}

	if err := c.ShouldBindJSON(&eventRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Log the event
	err = h.videoCallUseCase.LogEvent(lessonID, userID.(int), eventRequest.EventType, eventRequest.EventData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}

// RegisterRoutes registers the video call routes
func (h *VideoCallHandler) RegisterRoutes(r *gin.Engine) {
	videoCallGroup := r.Group("/api/video-call")
	videoCallGroup.Use(middleware.AuthMiddleware())
	{
		videoCallGroup.POST("/lessons/:id/session", h.InitializeVideoSession)
		videoCallGroup.POST("/lessons/:id/events", h.LogVideoCallEvent)
	}
}
