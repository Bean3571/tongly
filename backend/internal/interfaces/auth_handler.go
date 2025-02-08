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
	// Tutor registration fields
	EducationDegree      string  `json:"education_degree,omitempty"`
	EducationInstitution string  `json:"education_institution,omitempty"`
	IntroductionVideo    string  `json:"introduction_video,omitempty"`
	HourlyRate           float64 `json:"hourly_rate,omitempty"`
	OffersTrial          bool    `json:"offers_trial,omitempty"`
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

	// Validate tutor fields if registering as tutor
	if req.Role == "tutor" {
		if req.EducationDegree == "" || req.EducationInstitution == "" || req.IntroductionVideo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required tutor fields"})
			return
		}
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

	// If registering as tutor, create tutor profile
	if req.Role == "tutor" {
		tutorReq := entities.TutorRegistrationRequest{
			EducationDegree:      req.EducationDegree,
			EducationInstitution: req.EducationInstitution,
			IntroductionVideo:    req.IntroductionVideo,
			HourlyRate:           req.HourlyRate,
			OffersTrial:          req.OffersTrial,
		}

		// Generate token first
		token, err := jwt.GenerateToken(registeredUser.ID, registeredUser.Role)
		if err != nil {
			logger.Error("Failed to generate token", "error", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
			return
		}

		if err := h.TutorUseCase.RegisterTutor(c.Request.Context(), registeredUser.ID, tutorReq); err != nil {
			logger.Error("Failed to create tutor profile", "error", err)
			// Continue with registration but notify user of tutor profile creation failure
			c.JSON(http.StatusOK, gin.H{
				"token":   token,
				"user":    registeredUser,
				"warning": "User registered but failed to create tutor profile. Please try again later.",
			})
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
		return
	}

	// For non-tutor registrations
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
