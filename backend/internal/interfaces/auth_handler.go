package interfaces

import (
	"net/http"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/logger"
	"tongly/backend/internal/usecases"
	"tongly/backend/pkg/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	AuthUseCase usecases.AuthUseCase
}

func (h *AuthHandler) Register(c *gin.Context) {
	logger.Info("Register endpoint called")
	var user entities.User
	if err := c.ShouldBindJSON(&user); err != nil {
		logger.Error("Invalid request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if err := h.AuthUseCase.Register(user); err != nil {
		logger.Error("Failed to register user", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	logger.Info("User registered successfully", "username", user.Username)
	c.JSON(http.StatusOK, gin.H{"message": "User registered successfully"})
}

func (h *AuthHandler) Login(c *gin.Context) {
	logger.Info("Login endpoint called")
	var loginRequest struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&loginRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid username or password format"})
		return
	}

	user, err := h.AuthUseCase.Authenticate(loginRequest.Username, loginRequest.Password)
	if err != nil {
		logger.Error("Login failed", "error", err, "username", loginRequest.Username)
		if err.Error() == "user not found" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			return
		}
		if err.Error() == "invalid credentials" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect password"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Login failed. Please try again later"})
		return
	}

	token, err := utils.GenerateJWT(user.ID, user.Role)
	if err != nil {
		logger.Error("Failed to generate JWT", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.Info("User logged in successfully", "username", user.Username)
	c.JSON(http.StatusOK, gin.H{"token": token})
}
