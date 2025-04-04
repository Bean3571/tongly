package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
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

	// Always return an array, even if empty
	if languages == nil {
		languages = []entities.Language{}
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

	// Always return an array, even if empty
	if proficiencies == nil {
		proficiencies = []entities.LanguageProficiency{}
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

	// Always return an array, even if empty
	if interests == nil {
		interests = []entities.Interest{}
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

	// Always return an array, even if empty
	if goals == nil {
		goals = []entities.Goal{}
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
		api.GET("/language-proficiencies", h.GetAllProficiencies)

		// Interest routes
		api.GET("/interests", h.GetAllInterests)

		// Goal routes
		api.GET("/goals", h.GetAllGoals)
	}
}
