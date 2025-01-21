package router

import (
	"tongly/backend/internal/interfaces"

	"github.com/gin-gonic/gin"
)

func SetupRouter(authHandler *interfaces.AuthHandler, tutorHandler *interfaces.TutorHandler, gamificationHandler *interfaces.GamificationHandler) *gin.Engine {
	router := gin.Default()

	// Auth routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Tutor routes
	router.POST("/api/tutors", tutorHandler.RegisterTutor)
	router.GET("/api/tutors", tutorHandler.ListTutors)

	// Gamification routes
	router.POST("/api/challenges/submit", gamificationHandler.SubmitChallenge)
	router.GET("/api/leaderboards", gamificationHandler.GetLeaderboard)

	return router
}
