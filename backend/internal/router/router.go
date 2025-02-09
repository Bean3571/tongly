package router

import (
	"tongly-backend/internal/interfaces"
	"tongly-backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, authHandler *interfaces.AuthHandler, tutorHandler *interfaces.TutorHandler, gamificationHandler *interfaces.GamificationHandler, userHandler *interfaces.UserHandler) {
	// Add logger middleware with configuration
	r.Use(middleware.Logger(middleware.LoggerConfig{
		// Skip logging for health check and options requests
		SkipPaths: []string{"/health", "/metrics"},
		// Skip logging for 304 Not Modified responses
		SkipStatusCodes: []int{304},
	}))

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Handle OPTIONS requests
	r.OPTIONS("/*any", func(c *gin.Context) {
		c.Status(200)
	})

	// Serve static files
	r.Static("/uploads", "./uploads")

	api := r.Group("/api")

	// Auth routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// User profile routes
		protected.GET("/profile", userHandler.GetProfile)
		protected.PUT("/profile", userHandler.UpdateProfile)
		protected.PUT("/profile/password", userHandler.UpdatePassword)
		protected.POST("/profile/avatar", userHandler.UploadProfilePicture)

		// Tutor routes
		protected.POST("/tutors", tutorHandler.RegisterTutor)
		protected.GET("/tutors", tutorHandler.ListTutors)
		protected.PUT("/tutors/profile", tutorHandler.UpdateTutorProfile)
		protected.GET("/tutors/profile", tutorHandler.GetTutorProfile)
		protected.PUT("/tutors/:id/approval", tutorHandler.UpdateTutorApprovalStatus)

		// Gamification routes
		protected.POST("/challenges/submit", gamificationHandler.SubmitChallenge)
		protected.GET("/leaderboards", gamificationHandler.GetLeaderboard)
	}
}
