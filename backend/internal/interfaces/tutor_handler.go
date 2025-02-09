package interfaces

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

type TutorHandler struct {
	TutorUseCase *usecases.TutorUseCase
}

func NewTutorHandler(tutorUseCase *usecases.TutorUseCase) *TutorHandler {
	return &TutorHandler{
		TutorUseCase: tutorUseCase,
	}
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

// ListTutors handles GET /tutors
func (h *TutorHandler) ListTutors(c *gin.Context) {
	logger.Info("Handling list tutors request", "path", c.Request.URL.Path)

	// Get query parameters for filtering
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	// Parse filters from query parameters
	filters := usecases.TutorFilters{
		Language:    c.Query("language"),
		OffersTrial: c.Query("offers_trial") == "true",
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

	c.JSON(http.StatusOK, gin.H{"tutors": tutors})
}

// UpdateTutorApprovalStatus handles PUT /tutors/:id/approval
func (h *TutorHandler) UpdateTutorApprovalStatus(c *gin.Context) {
	logger.Info("Handling update tutor approval status request", "path", c.Request.URL.Path)

	// Get user role from context
	role, exists := c.Get("user_role")
	if !exists || role != "admin" {
		logger.Error("Non-admin attempting to update tutor approval status", "role", role)
		c.JSON(http.StatusForbidden, gin.H{"error": "Only admins can update tutor approval status"})
		return
	}

	tutorIDStr := c.Param("id")
	tutorID, err := strconv.Atoi(tutorIDStr)
	if err != nil {
		logger.Error("Invalid tutor ID", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid tutor ID"})
		return
	}

	var req struct {
		Approved bool `json:"approved" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid update tutor approval status request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.TutorUseCase.UpdateTutorApprovalStatus(c.Request.Context(), tutorID, req.Approved); err != nil {
		logger.Error("Failed to update tutor approval status", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tutor approval status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tutor approval status updated successfully"})
}

// GetTutorProfile handles GET /tutors/profile
func (h *TutorHandler) GetTutorProfile(c *gin.Context) {
	logger.Info("Handling get tutor profile request", "path", c.Request.URL.Path)

	// Get user ID from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get tutor details
	details, err := h.TutorUseCase.GetTutorDetails(c.Request.Context(), userID.(int))
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get tutor details"})
		return
	}
	if details == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Tutor profile not found"})
		return
	}

	c.JSON(http.StatusOK, details)
}

// UpdateTutorProfile handles PUT /tutors/profile
func (h *TutorHandler) UpdateTutorProfile(c *gin.Context) {
	logger.Info("Handling update tutor profile request", "path", c.Request.URL.Path)

	// Get user ID from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req entities.TutorUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid update tutor profile request",
			"error", err,
			"body", c.Request.Body)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Log the complete request data
	logger.Info("Received tutor profile update request",
		"user_id", userID,
		"request", map[string]interface{}{
			"bio":                     req.Bio,
			"teaching_languages_full": req.TeachingLanguages,
			"education_full":          req.Education,
			"interests_full":          req.Interests,
			"hourly_rate":             req.HourlyRate,
			"introduction_video":      req.IntroductionVideo,
			"offers_trial":            req.OffersTrial,
		})

	if err := h.TutorUseCase.UpdateTutorProfile(c.Request.Context(), userID.(int), req); err != nil {
		logger.Error("Failed to update tutor profile",
			"error", err,
			"user_id", userID,
			"request_data", req)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update tutor profile"})
		return
	}

	// Get updated profile to verify changes
	updatedProfile, err := h.TutorUseCase.GetTutorDetails(c.Request.Context(), userID.(int))
	if err != nil {
		logger.Error("Failed to get updated profile", "error", err)
	} else {
		logger.Info("Profile after update",
			"user_id", userID,
			"profile", map[string]interface{}{
				"bio":                updatedProfile.Bio,
				"teaching_languages": updatedProfile.TeachingLanguages,
				"education":          updatedProfile.Education,
				"interests":          updatedProfile.Interests,
				"hourly_rate":        updatedProfile.HourlyRate,
				"introduction_video": updatedProfile.IntroductionVideo,
				"offers_trial":       updatedProfile.OffersTrial,
			})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"profile": updatedProfile,
	})
}

// UploadVideo handles POST /tutors/video
func (h *TutorHandler) UploadVideo(c *gin.Context) {
	logger.Info("Handling tutor video upload request", "path", c.Request.URL.Path)

	// Get user ID from JWT token
	userID, exists := c.Get("user_id")
	if !exists {
		logger.Error("No user ID found")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the file from the request
	file, err := c.FormFile("video")
	if err != nil {
		logger.Error("Failed to get video file", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "No video file provided"})
		return
	}

	// Check file size (5MB limit)
	if file.Size > 5*1024*1024 {
		logger.Error("Video file too large", "size", file.Size)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Video file must be smaller than 5MB"})
		return
	}

	// Check file type
	if !strings.HasPrefix(file.Header.Get("Content-Type"), "video/") {
		logger.Error("Invalid file type", "content_type", file.Header.Get("Content-Type"))
		c.JSON(http.StatusBadRequest, gin.H{"error": "File must be a video"})
		return
	}

	// Generate a unique filename
	filename := fmt.Sprintf("tutor_%d_%s_%s", userID.(int), time.Now().Format("20060102150405"), file.Filename)

	// Save the file
	if err := c.SaveUploadedFile(file, "./uploads/videos/"+filename); err != nil {
		logger.Error("Failed to save video file", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video"})
		return
	}

	// Update the tutor's profile with the video URL
	videoURL := "/uploads/videos/" + filename
	if err := h.TutorUseCase.UpdateTutorVideo(c.Request.Context(), userID.(int), videoURL); err != nil {
		logger.Error("Failed to update tutor video URL", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update video URL"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Video uploaded successfully",
		"videoUrl": videoURL,
	})
}

func (h *TutorHandler) RegisterRoutes(r *gin.Engine) {
	tutors := r.Group("/tutors")
	{
		tutors.GET("", h.ListTutors)
		tutors.PUT("/:id/approval", middleware.AuthMiddleware(), h.UpdateTutorApprovalStatus)
		tutors.GET("/profile", middleware.AuthMiddleware(), h.GetTutorProfile)
		tutors.PUT("/profile", middleware.AuthMiddleware(), h.UpdateTutorProfile)
		tutors.POST("/video", middleware.AuthMiddleware(), h.UploadVideo)
	}
}
