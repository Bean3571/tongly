package router

import (
	"tongly-basic/backend/internal/interfaces"
	"tongly-basic/backend/pkg/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	r *gin.Engine,
	authHandler *interfaces.AuthHandler,
	tutorHandler *interfaces.TutorHandler,
	userHandler *interfaces.UserHandler,
	gamificationHandler *interfaces.GamificationHandler,
) {
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

		// Tutor routes
		protected.POST("/tutors", tutorHandler.RegisterTutor)
		protected.GET("/tutors", tutorHandler.ListTutors)
		protected.GET("/tutors/profile", tutorHandler.GetTutorProfile)

		// Gamification routes
		protected.POST("/challenges/submit", gamificationHandler.SubmitChallenge)
		protected.GET("/leaderboards", gamificationHandler.GetLeaderboard)
	}
}
