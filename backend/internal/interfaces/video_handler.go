package interfaces

import (
	"net/http"
	"strconv"
	"time"

	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

type VideoHandler struct {
	videoUseCase usecases.VideoUseCase
}

func NewVideoHandler(videoUseCase usecases.VideoUseCase) *VideoHandler {
	return &VideoHandler{
		videoUseCase: videoUseCase,
	}
}

// GetVideoSession handles GET /api/lessons/:id/video
func (h *VideoHandler) GetVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	session, err := h.videoUseCase.GetVideoSession(c.Request.Context(), lessonID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "video session not found"})
		return
	}

	c.JSON(http.StatusOK, session)
}

// StartVideoSession handles POST /api/lessons/:id/video/start
func (h *VideoHandler) StartVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	// Create a new video session
	session := &entities.VideoSession{
		LessonID:     lessonID,
		RoomID:       generateRoomID(lessonID),
		SessionToken: generateSessionToken(),
	}

	err = h.videoUseCase.StartVideoSession(c.Request.Context(), lessonID, session)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, session)
}

// EndVideoSession handles POST /api/lessons/:id/video/end
func (h *VideoHandler) EndVideoSession(c *gin.Context) {
	lessonID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid lesson ID"})
		return
	}

	err = h.videoUseCase.EndVideoSession(c.Request.Context(), lessonID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

func generateRoomID(lessonID int) string {
	return "room_" + strconv.Itoa(lessonID) + "_" + strconv.FormatInt(time.Now().Unix(), 10)
}

func generateSessionToken() string {
	return "session_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
