package router

import (
	"tongly/backend/internal/interfaces"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine, authHandler *interfaces.AuthHandler, tutorHandler *interfaces.TutorHandler, gamificationHandler *interfaces.GamificationHandler) {
	// Handle OPTIONS requests
	r.OPTIONS("/*any", func(c *gin.Context) {
		c.Status(200)
	})

	// Auth routes
	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)

	// Tutor routes
	r.POST("/api/tutors", tutorHandler.RegisterTutor)
	r.GET("/api/tutors", tutorHandler.ListTutors)

	// Gamification routes
	r.POST("/api/challenges/submit", gamificationHandler.SubmitChallenge)
	r.GET("/api/leaderboards", gamificationHandler.GetLeaderboard)
}
