package interfaces

import (
	"net/http"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

type TutorHandler struct {
	TutorUseCase *usecases.TutorUseCase
}

// RegisterTutor handles the tutor registration request
func (h *TutorHandler) RegisterTutor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req entities.TutorRegistrationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Failed to bind request data", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.TutorUseCase.RegisterTutor(c.Request.Context(), userID.(int), req)
	if err != nil {
		logger.Error("Failed to register tutor", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Tutor registration successful"})
}

// GetTutor retrieves a tutor's details
func (h *TutorHandler) GetTutor(c *gin.Context) {
	tutorID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	tutor, err := h.TutorUseCase.GetTutorByID(c.Request.Context(), tutorID)
	if err != nil {
		logger.Error("Failed to get tutor", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tutor"})
		return
	}

	if tutor == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tutor not found"})
		return
	}

	c.JSON(http.StatusOK, tutor)
}

// ListTutors retrieves a list of tutors with optional filtering
func (h *TutorHandler) ListTutors(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// Parse filters from query parameters
	filters := usecases.TutorFilters{
		ApprovalStatus: c.Query("status"),
		Language:       c.Query("language"),
		OffersTrial:    c.Query("offers_trial") == "true",
	}

	// Parse numeric filters
	if minRate, err := strconv.ParseFloat(c.Query("min_rate"), 64); err == nil {
		filters.MinHourlyRate = minRate
	}
	if maxRate, err := strconv.ParseFloat(c.Query("max_rate"), 64); err == nil {
		filters.MaxHourlyRate = maxRate
	}

	tutors, err := h.TutorUseCase.ListTutors(c.Request.Context(), page, pageSize, filters)
	if err != nil {
		logger.Error("Failed to list tutors", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list tutors"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tutors": tutors,
		"pagination": gin.H{
			"page":      page,
			"page_size": pageSize,
		},
		"filters": filters,
	})
}

// UpdateTutorApprovalStatus updates a tutor's approval status (admin only)
func (h *TutorHandler) UpdateTutorApprovalStatus(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("user_role")
	if !exists || userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	tutorID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err = h.TutorUseCase.UpdateTutorApprovalStatus(c.Request.Context(), tutorID, req.Status)
	if err != nil {
		logger.Error("Failed to update tutor status", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tutor status updated successfully"})
}

// UpdateProfile handles updating a tutor's profile
func (h *TutorHandler) UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req entities.TutorProfileUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Failed to bind request data", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	err := h.TutorUseCase.UpdateTutorProfile(c.Request.Context(), userID.(int), req)
	if err != nil {
		logger.Error("Failed to update tutor profile", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tutor profile updated successfully"})
}
