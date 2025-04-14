package interfaces

import (
	"net/http"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/jwt"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authUseCase    usecases.AuthUseCase
	tutorUseCase   *usecases.TutorUseCase
	studentUseCase *usecases.StudentUseCase
}

type LoginCredentials struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=student tutor"`
}

func NewAuthHandler(
	authUseCase usecases.AuthUseCase,
	tutorUseCase *usecases.TutorUseCase,
	studentUseCase *usecases.StudentUseCase,
) *AuthHandler {
	return &AuthHandler{
		authUseCase:    authUseCase,
		tutorUseCase:   tutorUseCase,
		studentUseCase: studentUseCase,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	logger.Info("Handling registration request", "path", c.Request.URL.Path)

	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid registration request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Register the user
	user, err := h.authUseCase.Register(c.Request.Context(), req.Username, req.Email, req.Password, req.Role)
	if err != nil {
		logger.Error("Registration failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	// Generate token
	token, err := jwt.GenerateToken(user.ID, user.Role)
	if err != nil {
		logger.Error("Failed to generate token", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.Info("Registration successful", "username", user.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// Login handles user authentication
func (h *AuthHandler) Login(c *gin.Context) {
	logger.Info("Handling login request", "path", c.Request.URL.Path)

	var credentials LoginCredentials
	if err := c.ShouldBindJSON(&credentials); err != nil {
		logger.Error("Invalid login request", "error", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid credentials"})
		return
	}

	user, err := h.authUseCase.Authenticate(c.Request.Context(), credentials.Username, credentials.Password)
	if err != nil {
		logger.Error("Authentication failed", "username", credentials.Username, "error", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := jwt.GenerateToken(user.ID, user.Role)
	if err != nil {
		logger.Error("Failed to generate token", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.Info("Login successful", "username", user.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func (h *AuthHandler) RegisterRoutes(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		// Public authentication endpoints
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)

		// Protected authentication endpoints
		authProtected := auth.Group("")
		authProtected.Use(middleware.AuthMiddleware())
		{
			auth.POST("/refresh", h.RefreshToken)
		}
	}
}

// RefreshToken handles token refresh requests
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	// Get user ID from the context (set by AuthMiddleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get user role from the context
	userRole, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Generate a new token
	token, err := jwt.GenerateToken(userID.(int), userRole.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}
