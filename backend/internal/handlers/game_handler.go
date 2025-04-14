package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// GameHandler handles HTTP requests for games
type GameHandler struct {
	gameUseCase *usecases.GameUseCase
}

// NewGameHandler creates a new GameHandler
func NewGameHandler(gameUseCase *usecases.GameUseCase) *GameHandler {
	return &GameHandler{
		gameUseCase: gameUseCase,
	}
}

// RegisterRoutes registers the routes for game operations
func (h *GameHandler) RegisterRoutes(router *gin.Engine) {
	games := router.Group("/api/games")
	games.Use(middleware.AuthMiddleware())
	games.Use(middleware.RoleMiddleware("student"))

	games.GET("/questions/:game_type/:language", h.GetGameQuestions)
	games.POST("/results", h.SaveGameResult)
	games.GET("/leaderboard", h.GetLeaderboard)
}

// GetGameQuestions handles requests to get game questions
func (h *GameHandler) GetGameQuestions(c *gin.Context) {
	gameType := c.Param("game_type")
	language := c.Param("language")

	// Validate game type
	if gameType != "emoji_quiz" && gameType != "emoji_typing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game type"})
		return
	}

	// Validate language
	if language != "en" && language != "es" && language != "ru" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language"})
		return
	}

	// Generate 5 questions
	questionSet, err := h.gameUseCase.GenerateGameQuestions(c.Request.Context(), gameType, language, 5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate questions"})
		return
	}

	c.JSON(http.StatusOK, questionSet)
}

// SaveGameResult handles requests to save game results
func (h *GameHandler) SaveGameResult(c *gin.Context) {
	// Get user ID from context
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(int)

	// Parse request body
	var request entities.SaveGameResultRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Validate game type
	if request.GameType != "emoji_quiz" && request.GameType != "emoji_typing" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid game type"})
		return
	}

	// Validate score based on game type
	if request.GameType == "emoji_quiz" && (request.Score < 0 || request.Score > 50) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid score for quiz game"})
		return
	}
	if request.GameType == "emoji_typing" && (request.Score < 0 || request.Score > 100) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid score for typing game"})
		return
	}

	// Save game result
	err := h.gameUseCase.SaveGameResult(c.Request.Context(), userID, &request)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save game result"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GetLeaderboard handles requests to get the leaderboard
func (h *GameHandler) GetLeaderboard(c *gin.Context) {
	// Get user ID from context
	userIDInterface, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := userIDInterface.(int)

	// Get leaderboard and user's rank
	leaderboard, userRank, err := h.gameUseCase.GetLeaderboard(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"leaderboard": leaderboard,
		"user_rank":   userRank,
	})
}
