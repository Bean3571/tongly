package interfaces

import (
	"fmt"
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
		// Room management in a separate group
		room := lessons.Group("/:id/room")
		{
			room.GET("", middleware.AuthMiddleware(), h.GetRoomInfo)
			room.POST("/join", middleware.AuthMiddleware(), h.JoinLessonRoom)
			room.POST("/leave", middleware.AuthMiddleware(), h.LeaveRoom)
		}

		// Lesson management
		lessons.POST("", middleware.AuthMiddleware(), h.BookLesson)
		lessons.GET("/:id", middleware.AuthMiddleware(), h.GetLesson)
		lessons.POST("/:id/cancel", middleware.AuthMiddleware(), h.CancelLesson)
		lessons.GET("/upcoming", middleware.AuthMiddleware(), h.GetLessons)
		lessons.GET("/completed", middleware.AuthMiddleware(), h.GetLessons)

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

func (h *LessonHandler) StartVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	userID, exists := c.Get("user_id")
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

	userID, exists := c.Get("user_id")
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

	userID, exists := c.Get("user_id")
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

func (h *LessonHandler) JoinLessonRoom(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("Invalid lesson ID: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	// Get the current user
	userID := c.GetInt("user_id")
	if userID == 0 {
		fmt.Printf("Unauthorized: user_id is 0\n")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fmt.Printf("Attempting to join lesson %d for user %d\n", lessonID, userID)

	// Get the lesson
	lesson, err := h.lessonUseCase.GetLessonByID(c.Request.Context(), userID, lessonID)
	if err != nil {
		fmt.Printf("Failed to get lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Lesson not found: %v", err)})
		return
	}

	// Check if the user is a participant in the lesson
	if lesson.StudentID != userID && lesson.TutorID != userID {
		fmt.Printf("User %d is not a participant in lesson %d (student: %d, tutor: %d)\n",
			userID, lessonID, lesson.StudentID, lesson.TutorID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a participant in this lesson"})
		return
	}

	// Check if the lesson can be started
	if err := lesson.CanStart(); err != nil {
		fmt.Printf("Cannot start lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Cannot join lesson: %v", err)})
		return
	}

	fmt.Printf("Getting video session for lesson %d\n", lessonID)
	// Try to get existing session first
	session, err := h.videoSessionUseCase.GetSession(c.Request.Context(), lessonID, userID)
	if err != nil {
		fmt.Printf("Failed to get video session for lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get video session: %v", err)})
		return
	}

	// If no session exists, create one
	if session == nil {
		fmt.Printf("Creating new video session for lesson %d\n", lessonID)
		session, err = h.videoSessionUseCase.StartSession(c.Request.Context(), lessonID, userID)
		if err != nil {
			fmt.Printf("Failed to create video session for lesson %d: %v\n", lessonID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create video session: %v", err)})
			return
		}
	}

	fmt.Printf("Adding user %d as participant to lesson %d\n", userID, lessonID)
	// Add the user as a participant
	if err := h.videoSessionUseCase.AddParticipant(c.Request.Context(), lessonID, userID); err != nil {
		fmt.Printf("Failed to add participant %d to lesson %d: %v\n", userID, lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to add participant: %v", err)})
		return
	}

	fmt.Printf("Getting participants for lesson %d\n", lessonID)
	// Get the current participants
	participants, err := h.videoSessionUseCase.GetParticipants(c.Request.Context(), lessonID)
	if err != nil {
		fmt.Printf("Failed to get participants for lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get participants: %v", err)})
		return
	}

	// Update lesson status to in_progress if it's not already
	if lesson.Status == entities.LessonStatusScheduled {
		fmt.Printf("Updating lesson %d status to in_progress\n", lessonID)
		lesson.Status = entities.LessonStatusInProgress
		if err := h.lessonUseCase.UpdateLessonStatus(c.Request.Context(), lesson); err != nil {
			fmt.Printf("Failed to update lesson %d status: %v\n", lessonID, err)
			// Log the error but don't fail the request
		}
	}

	fmt.Printf("Successfully joined lesson %d with %d participants\n", lessonID, len(participants))
	// Return the room information with participants
	c.JSON(http.StatusOK, gin.H{
		"room_id":      session.RoomID,
		"token":        session.Token,
		"participants": participants,
	})
}

func (h *LessonHandler) LeaveRoom(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	if err := h.videoSessionUseCase.RemoveParticipant(c.Request.Context(), lessonID, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove participant"})
		return
	}

	c.Status(http.StatusOK)
}

func (h *LessonHandler) GetRoomInfo(c *gin.Context) {
	fmt.Printf("GetRoomInfo: Handler called with path %s\n", c.Request.URL.Path)

	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		fmt.Printf("GetRoomInfo: Invalid lesson ID in path %s: %v\n", c.Request.URL.Path, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lesson ID"})
		return
	}

	userID := c.GetInt("user_id")
	if userID == 0 {
		fmt.Printf("GetRoomInfo: Unauthorized - no user_id in context\n")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	fmt.Printf("GetRoomInfo: Processing request for lesson %d, user %d\n", lessonID, userID)

	// First check if the user has access to this lesson
	lesson, err := h.lessonUseCase.GetLessonByID(c.Request.Context(), userID, lessonID)
	if err != nil {
		fmt.Printf("GetRoomInfo: Failed to get lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Lesson not found"})
		return
	}

	// Check if the user is a participant in the lesson
	if lesson.StudentID != userID && lesson.TutorID != userID {
		fmt.Printf("GetRoomInfo: User %d is not a participant in lesson %d (student: %d, tutor: %d)\n",
			userID, lessonID, lesson.StudentID, lesson.TutorID)
		c.JSON(http.StatusForbidden, gin.H{"error": "You are not a participant in this lesson"})
		return
	}

	fmt.Printf("GetRoomInfo: Getting session for lesson %d\n", lessonID)
	// Try to get existing session first
	session, err := h.videoSessionUseCase.GetSession(c.Request.Context(), lessonID, userID)
	if err != nil {
		fmt.Printf("GetRoomInfo: Error getting session for lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get session: %v", err)})
		return
	}

	// If no session exists, create one
	if session == nil {
		fmt.Printf("GetRoomInfo: No session found for lesson %d, creating new session\n", lessonID)
		session, err = h.videoSessionUseCase.StartSession(c.Request.Context(), lessonID, userID)
		if err != nil {
			fmt.Printf("GetRoomInfo: Failed to create session for lesson %d: %v\n", lessonID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create session: %v", err)})
			return
		}
		fmt.Printf("GetRoomInfo: Created new session for lesson %d\n", lessonID)
	}

	fmt.Printf("GetRoomInfo: Adding user %d as participant\n", userID)
	// Add the user as a participant if they're not already
	if err := h.videoSessionUseCase.AddParticipant(c.Request.Context(), lessonID, userID); err != nil {
		fmt.Printf("GetRoomInfo: Failed to add participant %d to lesson %d: %v\n", userID, lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to add participant: %v", err)})
		return
	}

	fmt.Printf("GetRoomInfo: Getting participants for lesson %d\n", lessonID)
	participants, err := h.videoSessionUseCase.GetParticipants(c.Request.Context(), lessonID)
	if err != nil {
		fmt.Printf("GetRoomInfo: Failed to get participants for lesson %d: %v\n", lessonID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get participants"})
		return
	}

	// Update lesson status to in_progress if it's not already
	if lesson.Status == entities.LessonStatusScheduled {
		fmt.Printf("GetRoomInfo: Updating lesson %d status to in_progress\n", lessonID)
		lesson.Status = entities.LessonStatusInProgress
		if err := h.lessonUseCase.UpdateLessonStatus(c.Request.Context(), lesson); err != nil {
			// Log the error but don't fail the request
			fmt.Printf("GetRoomInfo: Failed to update lesson %d status: %v\n", lessonID, err)
		}
	}

	fmt.Printf("GetRoomInfo: Successfully retrieved room info for lesson %d with %d participants\n", lessonID, len(participants))
	c.JSON(http.StatusOK, gin.H{
		"room_id":      session.RoomID,
		"token":        session.Token,
		"participants": participants,
	})
}
