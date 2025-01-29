package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

type TutorHandler struct {
	TutorUseCase usecases.TutorUseCase
}

func (h *TutorHandler) RegisterTutor(c *gin.Context) {
	var tutor entities.Tutor
	if err := c.ShouldBindJSON(&tutor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.TutorUseCase.RegisterTutor(tutor); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register tutor"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tutor registered successfully"})
}

func (h *TutorHandler) ListTutors(c *gin.Context) {
	tutors, err := h.TutorUseCase.ListTutors()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tutors"})
		return
	}

	c.JSON(http.StatusOK, tutors)
}
