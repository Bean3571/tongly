package interfaces

import (
	"fmt"
	"net/http"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
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
	availability, err := h.tutorUseCase.AddTutorAvailability(c.Request.Context(), tutorID, &req)
	if err != nil {
		logger.Error("Failed to add availability", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add availability"})
		return
	}

	c.JSON(http.StatusOK, availability)
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
	availability, err := h.tutorUseCase.UpdateTutorAvailability(c.Request.Context(), tutorID, availabilityID, &req)
	if err != nil {
		logger.Error("Failed to update availability", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update availability"})
		return
	}

	c.JSON(http.StatusOK, availability)
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
		logger.Error("Failed to retrieve availabilities", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve availabilities"})
		return
	}

	// Return an empty array if there are no availabilities to ensure consistent response format
	if availabilities == nil {
		availabilities = []entities.TutorAvailability{}
	}

	// Log the response for debugging
	logger.Info("Returning availabilities", "count", len(availabilities))

	c.JSON(http.StatusOK, availabilities)
}

// SearchTutors handles the request to search for tutors
func (h *TutorHandler) SearchTutors(c *gin.Context) {
	var filters entities.TutorSearchFilters

	// Get language filter from query parameters
	languages := c.QueryArray("language")
	if len(languages) > 0 {
		filters.Languages = languages
	}

	// Get proficiency filter
	proficiencyStr := c.Query("proficiency_id")
	if proficiencyStr != "" {
		proficiencyID, err := strconv.Atoi(proficiencyStr)
		if err == nil && proficiencyID > 0 {
			filters.ProficiencyID = proficiencyID
		}
	}

	// Get interests filter
	interests := c.QueryArray("interest")
	if len(interests) > 0 {
		interestIDs := make([]int, 0, len(interests))
		for _, idStr := range interests {
			id, err := strconv.Atoi(idStr)
			if err == nil && id > 0 {
				interestIDs = append(interestIDs, id)
			}
		}
		if len(interestIDs) > 0 {
			filters.Interests = interestIDs
		}
	}

	// Get goals filter
	goals := c.QueryArray("goal")
	if len(goals) > 0 {
		goalIDs := make([]int, 0, len(goals))
		for _, idStr := range goals {
			id, err := strconv.Atoi(idStr)
			if err == nil && id > 0 {
				goalIDs = append(goalIDs, id)
			}
		}
		if len(goalIDs) > 0 {
			filters.Goals = goalIDs
		}
	}

	// Get years experience filter
	yearsExpStr := c.Query("years_experience")
	if yearsExpStr != "" {
		yearsExp, err := strconv.Atoi(yearsExpStr)
		if err == nil && yearsExp >= 0 {
			filters.YearsExperience = yearsExp
		}
	}

	// Get age range filter
	minAgeStr := c.Query("min_age")
	if minAgeStr != "" {
		minAge, err := strconv.Atoi(minAgeStr)
		if err == nil && minAge > 0 {
			filters.MinAge = minAge
		}
	}

	maxAgeStr := c.Query("max_age")
	if maxAgeStr != "" {
		maxAge, err := strconv.Atoi(maxAgeStr)
		if err == nil && maxAge > 0 {
			filters.MaxAge = maxAge
		}
	}

	// Get sex filter
	sex := c.Query("sex")
	if sex == "male" || sex == "female" {
		filters.Sex = sex
	}

	// Log filter information for debugging
	logger.Info("SearchTutors called with filters: %+v", filters)

	tutors, err := h.tutorUseCase.SearchTutors(c.Request.Context(), &filters)
	if err != nil {
		logger.Error("Error in SearchTutors: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to search tutors: %v", err)})
		return
	}

	c.JSON(http.StatusOK, tutors)
}

// GetTutorByID handles the request to retrieve a tutor's profile by ID
func (h *TutorHandler) GetTutorByID(c *gin.Context) {
	tutorIDStr := c.Param("tutorId")
	tutorID, err := strconv.Atoi(tutorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	profile, err := h.tutorUseCase.GetTutorProfile(c.Request.Context(), tutorID)
	if err != nil {
		logger.Error("Failed to retrieve tutor profile", "error", err, "tutorID", tutorID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tutor profile"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// GetTutorAvailabilitiesByID handles the request to retrieve availabilities for a tutor by ID
func (h *TutorHandler) GetTutorAvailabilitiesByID(c *gin.Context) {
	tutorIDStr := c.Param("tutorId")
	tutorID, err := strconv.Atoi(tutorIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	availabilities, err := h.tutorUseCase.GetTutorAvailabilities(c.Request.Context(), tutorID)
	if err != nil {
		logger.Error("Failed to retrieve availabilities", "error", err, "tutorID", tutorID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve availabilities"})
		return
	}

	if availabilities == nil {
		availabilities = []entities.TutorAvailability{}
	}

	c.JSON(http.StatusOK, availabilities)
}

// RegisterRoutes registers the tutor routes
func (h *TutorHandler) RegisterRoutes(router *gin.Engine) {
	// Public routes (no authentication required)
	public := router.Group("/api/tutors")
	{
		public.GET("/search", h.SearchTutors)
		public.GET("/:tutorId", h.GetTutorByID)
		public.GET("/:tutorId/availabilities", h.GetTutorAvailabilitiesByID)
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
	}

	// Additional routes to match the frontend API calls
	tutors := router.Group("/api/tutors")
	tutors.Use(middleware.AuthMiddleware())
	{
		tutors.GET("/me/profile", h.GetProfile)
		tutors.PUT("/me/profile", h.UpdateProfile)
	}
}
