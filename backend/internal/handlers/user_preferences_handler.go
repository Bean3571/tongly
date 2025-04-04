package interfaces

import (
	"net/http"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// UserPreferencesHandler handles HTTP requests for user preferences
type UserPreferencesHandler struct {
	prefsUseCase *usecases.UserPreferencesUseCase
}

// NewUserPreferencesHandler creates a new UserPreferencesHandler
func NewUserPreferencesHandler(prefsUseCase *usecases.UserPreferencesUseCase) *UserPreferencesHandler {
	return &UserPreferencesHandler{
		prefsUseCase: prefsUseCase,
	}
}

// GetUserLanguages handles the request to retrieve languages for a user
func (h *UserPreferencesHandler) GetUserLanguages(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	languages, err := h.prefsUseCase.GetUserLanguages(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve languages"})
		return
	}

	// Always return an array, even if empty
	if languages == nil {
		languages = []entities.UserLanguage{}
	}

	c.JSON(http.StatusOK, languages)
}

// AddUserLanguage handles the request to add a language to a user's profile
func (h *UserPreferencesHandler) AddUserLanguage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		LanguageID    int `json:"language_id" binding:"required"`
		ProficiencyID int `json:"proficiency_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userLanguage, err := h.prefsUseCase.AddUserLanguage(c.Request.Context(), userID.(int), req.LanguageID, req.ProficiencyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add language: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, userLanguage)
}

// UpdateUserLanguage handles the request to update a language's proficiency in a user's profile
func (h *UserPreferencesHandler) UpdateUserLanguage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		LanguageID    int `json:"language_id" binding:"required"`
		ProficiencyID int `json:"proficiency_id" binding:"required"`
	}

	// Try to get languageId from URL path
	languageIDStr := c.Param("languageId")
	var languageID int
	var err error
	if languageIDStr != "" {
		languageID, err = strconv.Atoi(languageIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language ID"})
			return
		}
	}

	// If no path parameter, use body
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Use path parameter if available, otherwise use body
	if languageID != 0 {
		req.LanguageID = languageID
	}

	userLanguage, err := h.prefsUseCase.UpdateUserLanguage(c.Request.Context(), userID.(int), req.LanguageID, req.ProficiencyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update language: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, userLanguage)
}

// RemoveUserLanguage handles the request to remove a language from a user's profile
func (h *UserPreferencesHandler) RemoveUserLanguage(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	languageIDStr := c.Param("languageId")
	languageID, err := strconv.Atoi(languageIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid language ID"})
		return
	}

	if err := h.prefsUseCase.RemoveUserLanguage(c.Request.Context(), userID.(int), languageID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove language"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Language removed successfully"})
}

// GetUserInterests handles the request to retrieve interests for a user
func (h *UserPreferencesHandler) GetUserInterests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	interests, err := h.prefsUseCase.GetUserInterests(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve interests"})
		return
	}

	// Always return an array, even if empty
	if interests == nil {
		interests = []entities.UserInterest{}
	}

	c.JSON(http.StatusOK, interests)
}

// AddUserInterest handles the request to add an interest to a user's profile
func (h *UserPreferencesHandler) AddUserInterest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		InterestID int `json:"interest_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userInterest, err := h.prefsUseCase.AddUserInterest(c.Request.Context(), userID.(int), req.InterestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add interest: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, userInterest)
}

// RemoveUserInterest handles the request to remove an interest from a user's profile
func (h *UserPreferencesHandler) RemoveUserInterest(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	interestIDStr := c.Param("interestId")
	interestID, err := strconv.Atoi(interestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid interest ID"})
		return
	}

	if err := h.prefsUseCase.RemoveUserInterest(c.Request.Context(), userID.(int), interestID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove interest"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Interest removed successfully"})
}

// GetUserGoals handles the request to retrieve goals for a user
func (h *UserPreferencesHandler) GetUserGoals(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	goals, err := h.prefsUseCase.GetUserGoals(c.Request.Context(), userID.(int))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve goals"})
		return
	}

	// Always return an array, even if empty
	if goals == nil {
		goals = []entities.UserGoal{}
	}

	c.JSON(http.StatusOK, goals)
}

// AddUserGoal handles the request to add a goal to a user's profile
func (h *UserPreferencesHandler) AddUserGoal(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req struct {
		GoalID int `json:"goal_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userGoal, err := h.prefsUseCase.AddUserGoal(c.Request.Context(), userID.(int), req.GoalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add goal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, userGoal)
}

// RemoveUserGoal handles the request to remove a goal from a user's profile
func (h *UserPreferencesHandler) RemoveUserGoal(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	goalIDStr := c.Param("goalId")
	goalID, err := strconv.Atoi(goalIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid goal ID"})
		return
	}

	if err := h.prefsUseCase.RemoveUserGoal(c.Request.Context(), userID.(int), goalID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove goal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Goal removed successfully"})
}

// RegisterRoutes registers the user preferences routes
func (h *UserPreferencesHandler) RegisterRoutes(router *gin.Engine) {
	// User preferences routes with new path
	prefs := router.Group("/api/preferences")
	prefs.Use(middleware.AuthMiddleware())
	{
		// Language routes
		prefs.GET("/languages", h.GetUserLanguages)
		prefs.POST("/languages", h.AddUserLanguage)
		prefs.PUT("/languages", h.UpdateUserLanguage)
		prefs.DELETE("/languages/:languageId", h.RemoveUserLanguage)

		// Interest routes
		prefs.GET("/interests", h.GetUserInterests)
		prefs.POST("/interests", h.AddUserInterest)
		prefs.DELETE("/interests/:interestId", h.RemoveUserInterest)

		// Goal routes
		prefs.GET("/goals", h.GetUserGoals)
		prefs.POST("/goals", h.AddUserGoal)
		prefs.DELETE("/goals/:goalId", h.RemoveUserGoal)
	}

	// Same routes with different paths to match frontend expectations
	me := router.Group("/api/users/me")
	me.Use(middleware.AuthMiddleware())
	{
		// Language routes
		me.GET("/languages", h.GetUserLanguages)
		me.POST("/languages", h.AddUserLanguage)
		me.PUT("/languages/:languageId", h.UpdateUserLanguage)
		me.DELETE("/languages/:languageId", h.RemoveUserLanguage)

		// Interest routes
		me.GET("/interests", h.GetUserInterests)
		me.POST("/interests", h.AddUserInterest)
		me.DELETE("/interests/:interestId", h.RemoveUserInterest)

		// Goal routes
		me.GET("/goals", h.GetUserGoals)
		me.POST("/goals", h.AddUserGoal)
		me.DELETE("/goals/:goalId", h.RemoveUserGoal)
	}
}
