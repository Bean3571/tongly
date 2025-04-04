package interfaces

import (
	"net/http"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

// TutorHandler handles HTTP requests for tutor-related functionality
type TutorHandler struct {
	tutorUseCase *usecases.TutorUseCase
}

// NewTutorHandler creates a new TutorHandler
func NewTutorHandler(tutorUseCase *usecases.TutorUseCase) *TutorHandler {
	return &TutorHandler{
		tutorUseCase: tutorUseCase,
	}
}

// GetProfile handles the request to retrieve a tutor's profile
func (h *TutorHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	tutorID := userID.(int)
	profile, err := h.tutorUseCase.GetTutorProfile(c.Request.Context(), tutorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// UpdateProfile handles the request to update a tutor's profile
func (h *TutorHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req entities.TutorUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	tutorID := userID.(int)
	if err := h.tutorUseCase.UpdateTutorProfile(c.Request.Context(), tutorID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// AddAvailability handles the request to add an availability slot for a tutor
func (h *TutorHandler) AddAvailability(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req entities.TutorAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	tutorID := userID.(int)
	if err := h.tutorUseCase.AddTutorAvailability(c.Request.Context(), tutorID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Availability added successfully"})
}

// UpdateAvailability handles the request to update an availability slot
func (h *TutorHandler) UpdateAvailability(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	availabilityIDStr := c.Param("availabilityId")
	availabilityID, err := strconv.Atoi(availabilityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid availability ID"})
		return
	}

	var req entities.TutorAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	tutorID := userID.(int)
	if err := h.tutorUseCase.UpdateTutorAvailability(c.Request.Context(), tutorID, availabilityID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Availability updated successfully"})
}

// DeleteAvailability handles the request to delete an availability slot
func (h *TutorHandler) DeleteAvailability(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	availabilityIDStr := c.Param("availabilityId")
	availabilityID, err := strconv.Atoi(availabilityIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid availability ID"})
		return
	}

	tutorID := userID.(int)
	if err := h.tutorUseCase.DeleteTutorAvailability(c.Request.Context(), tutorID, availabilityID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete availability"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Availability deleted successfully"})
}

// GetAvailabilities handles the request to retrieve all availabilities for a tutor
func (h *TutorHandler) GetAvailabilities(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	tutorID := userID.(int)
	availabilities, err := h.tutorUseCase.GetTutorAvailabilities(c.Request.Context(), tutorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve availabilities"})
		return
	}

	c.JSON(http.StatusOK, availabilities)
}

// GetUpcomingLessons handles the request to retrieve upcoming lessons for a tutor
func (h *TutorHandler) GetUpcomingLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	tutorID := userID.(int)
	lessons, err := h.tutorUseCase.GetUpcomingLessons(c.Request.Context(), tutorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// GetPastLessons handles the request to retrieve past lessons for a tutor
func (h *TutorHandler) GetPastLessons(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	tutorID := userID.(int)
	lessons, err := h.tutorUseCase.GetPastLessons(c.Request.Context(), tutorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve lessons"})
		return
	}

	c.JSON(http.StatusOK, lessons)
}

// SearchTutors handles the request to search for tutors
func (h *TutorHandler) SearchTutors(c *gin.Context) {
	var filters entities.TutorSearchFilters

	// Get language filter from query parameters
	languages := c.QueryArray("language")
	if len(languages) > 0 {
		filters.Languages = languages
	}

	// Add more filters here as needed

	tutors, err := h.tutorUseCase.SearchTutors(c.Request.Context(), &filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search tutors"})
		return
	}

	c.JSON(http.StatusOK, tutors)
}

// RegisterRoutes registers the tutor routes
func (h *TutorHandler) RegisterRoutes(router *gin.Engine) {
	// Public routes (no authentication required)
	public := router.Group("/api/tutors")
	{
		public.GET("/search", h.SearchTutors)
	}

	// Protected routes (authentication required)
	tutor := router.Group("/api/tutor")
	tutor.Use(middleware.AuthMiddleware())
	{
		tutor.GET("/profile", h.GetProfile)
		tutor.PUT("/profile", h.UpdateProfile)
		tutor.GET("/availabilities", h.GetAvailabilities)
		tutor.POST("/availabilities", h.AddAvailability)
		tutor.PUT("/availabilities/:availabilityId", h.UpdateAvailability)
		tutor.DELETE("/availabilities/:availabilityId", h.DeleteAvailability)
		tutor.GET("/lessons/upcoming", h.GetUpcomingLessons)
		tutor.GET("/lessons/past", h.GetPastLessons)
	}

	// Additional routes to match the frontend API calls
	tutors := router.Group("/api/tutors")
	tutors.Use(middleware.AuthMiddleware())
	{
		tutors.GET("/me/profile", h.GetProfile)
		tutors.PUT("/me/profile", h.UpdateProfile)
	}
}
