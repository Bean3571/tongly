package interfaces

import (
	"net/http"
	"tongly-backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

// CommonHandler handles HTTP requests for common functionality like languages, interests, and goals
type CommonHandler struct {
	commonUseCase *usecases.CommonUseCase
}

// NewCommonHandler creates a new CommonHandler
func NewCommonHandler(commonUseCase *usecases.CommonUseCase) *CommonHandler {
	return &CommonHandler{
		commonUseCase: commonUseCase,
	}
}

// GetAllLanguages handles the request to retrieve all languages
func (h *CommonHandler) GetAllLanguages(c *gin.Context) {
	languages, err := h.commonUseCase.GetAllLanguages(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve languages"})
		return
	}

	c.JSON(http.StatusOK, languages)
}

// GetAllProficiencies handles the request to retrieve all language proficiency levels
func (h *CommonHandler) GetAllProficiencies(c *gin.Context) {
	proficiencies, err := h.commonUseCase.GetAllProficiencies(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve proficiencies"})
		return
	}

	c.JSON(http.StatusOK, proficiencies)
}

// GetAllInterests handles the request to retrieve all interests
func (h *CommonHandler) GetAllInterests(c *gin.Context) {
	interests, err := h.commonUseCase.GetAllInterests(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve interests"})
		return
	}

	c.JSON(http.StatusOK, interests)
}

// GetAllGoals handles the request to retrieve all goals
func (h *CommonHandler) GetAllGoals(c *gin.Context) {
	goals, err := h.commonUseCase.GetAllGoals(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve goals"})
		return
	}

	c.JSON(http.StatusOK, goals)
}

// RegisterRoutes registers the common routes
func (h *CommonHandler) RegisterRoutes(router *gin.Engine) {
	// All these routes are public
	api := router.Group("/api")
	{
		// Language routes
		api.GET("/languages", h.GetAllLanguages)
		api.GET("/languages/proficiencies", h.GetAllProficiencies)

		// Interest routes
		api.GET("/interests", h.GetAllInterests)

		// Goal routes
		api.GET("/goals", h.GetAllGoals)
	}
}
