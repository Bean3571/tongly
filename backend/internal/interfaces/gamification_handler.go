package interfaces

import (
	"net/http"
	"tongly-basic/backend/internal/entities"
	"tongly-basic/backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

type GamificationHandler struct {
	GamificationUseCase *usecases.GamificationUseCase
}

func NewGamificationHandler(gamificationUseCase *usecases.GamificationUseCase) *GamificationHandler {
	return &GamificationHandler{
		GamificationUseCase: gamificationUseCase,
	}
}

func (h *GamificationHandler) SubmitChallenge(c *gin.Context) {
	var challenge entities.Challenge
	if err := c.ShouldBindJSON(&challenge); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.GamificationUseCase.SubmitChallenge(challenge); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit challenge"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Challenge submitted successfully"})
}

func (h *GamificationHandler) GetLeaderboard(c *gin.Context) {
	leaderboard, err := h.GamificationUseCase.GetLeaderboard()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch leaderboard"})
		return
	}

	c.JSON(http.StatusOK, leaderboard)
}
