package interfaces

import (
    "net/http"
    "tongly/backend/internal/entities"
    "tongly/backend/internal/usecases"

    "github.com/gin-gonic/gin"
)

type AuthHandler struct {
    AuthUseCase usecases.AuthUseCase
}

func (h *AuthHandler) Register(c *gin.Context) {
    var user entities.User
    if err := c.ShouldBindJSON(&user); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    if err := h.AuthUseCase.Register(user); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}