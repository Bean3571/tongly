package interfaces

import (
	"net/http"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	AuthUseCase  *usecases.AuthUseCase
	TutorUseCase *usecases.TutorUseCase
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

func NewAuthHandler(authUseCase *usecases.AuthUseCase, tutorUseCase *usecases.TutorUseCase) *AuthHandler {
	return &AuthHandler{
		AuthUseCase:  authUseCase,
		TutorUseCase: tutorUseCase,
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

	user := entities.User{
		Username: req.Username,
		Email:    req.Email,
		Role:     req.Role,
		Password: req.Password,
	}

	if err := h.AuthUseCase.Register(user); err != nil {
		logger.Error("Registration failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to register user"})
		return
	}

	// Get the user after registration to have the ID
	registeredUser, err := h.AuthUseCase.Authenticate(req.Username, req.Password)
	if err != nil {
		logger.Error("Failed to authenticate after registration", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Registration successful but failed to login"})
		return
	}

	// If registering as a tutor, create tutor profile
	if req.Role == "tutor" {
		tutorReq := entities.TutorRegistrationRequest{
			EducationDegree:      "", // These will be filled out later
			EducationInstitution: "",
			IntroductionVideo:    "",
			HourlyRate:           25.0, // Default hourly rate
			OffersTrial:          true, // Default to offering trial
		}

		if err := h.TutorUseCase.RegisterTutor(c.Request.Context(), registeredUser.ID, tutorReq); err != nil {
			logger.Error("Failed to create tutor profile", "error", err)
			// Continue with registration even if tutor profile creation fails
			// The user can create it later through the tutor registration endpoint
		}
	}

	// Generate token
	token, err := jwt.GenerateToken(registeredUser.ID, registeredUser.Role)
	if err != nil {
		logger.Error("Failed to generate token", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	logger.Info("Registration successful", "username", user.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       registeredUser.ID,
			"username": registeredUser.Username,
			"email":    registeredUser.Email,
			"role":     registeredUser.Role,
		},
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

	user, err := h.AuthUseCase.Authenticate(credentials.Username, credentials.Password)
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
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

func (h *AuthHandler) RegisterRoutes(r *gin.Engine) {
	auth := r.Group("/auth")
	{
		auth.POST("/register", h.Register)
		auth.POST("/login", h.Login)
	}
}
