package interfaces

import (
	"net/http"
	"strconv"
	"tongly-basic/backend/internal/entities"
	"tongly-basic/backend/internal/logger"
	"tongly-basic/backend/internal/usecases"
	"tongly-basic/backend/pkg/utils"

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

func (h *TutorHandler) RegisterTutor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var data entities.TutorRegistrationData
	if err := c.ShouldBindJSON(&data); err != nil {
		logger.Error("Invalid tutor registration data", "error", err)
		utils.RespondWithError(c, http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	tutor, err := h.TutorUseCase.RegisterTutor(userID.(int), data)
	if err != nil {
		logger.Error("Failed to register tutor", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(c, http.StatusCreated, tutor)
}

func (h *TutorHandler) GetTutorProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tutor, err := h.TutorUseCase.GetTutorByUserID(userID.(int))
	if err != nil {
		logger.Error("Failed to get tutor profile", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	if tutor == nil {
		utils.RespondWithError(c, http.StatusNotFound, "Tutor profile not found")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, tutor)
}

func (h *TutorHandler) GetTutorByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		utils.RespondWithError(c, http.StatusBadRequest, "Invalid tutor ID")
		return
	}

	tutor, err := h.TutorUseCase.GetTutorByID(id)
	if err != nil {
		logger.Error("Failed to get tutor", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	if tutor == nil {
		utils.RespondWithError(c, http.StatusNotFound, "Tutor not found")
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, tutor)
}

func (h *TutorHandler) ListTutors(c *gin.Context) {
	tutors, err := h.TutorUseCase.ListTutors()
	if err != nil {
		logger.Error("Failed to list tutors", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, tutors)
}

func (h *TutorHandler) UpdateTutor(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.RespondWithError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	tutor, err := h.TutorUseCase.GetTutorByUserID(userID.(int))
	if err != nil {
		logger.Error("Failed to get tutor", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	if tutor == nil {
		utils.RespondWithError(c, http.StatusNotFound, "Tutor profile not found")
		return
	}

	var data entities.TutorRegistrationData
	if err := c.ShouldBindJSON(&data); err != nil {
		logger.Error("Invalid tutor update data", "error", err)
		utils.RespondWithError(c, http.StatusBadRequest, utils.FormatValidationError(err))
		return
	}

	updatedTutor, err := h.TutorUseCase.UpdateTutor(tutor.ID, data)
	if err != nil {
		logger.Error("Failed to update tutor", "error", err)
		utils.RespondWithError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.RespondWithJSON(c, http.StatusOK, updatedTutor)
}
