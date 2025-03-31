package router

import (
	"tongly-backend/internal/interfaces"
	"tongly-backend/pkg/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	r *gin.Engine,
	authHandler *interfaces.AuthHandler,
	tutorHandler *interfaces.TutorHandler,
	userHandler *interfaces.UserHandler,
	lessonHandler *interfaces.LessonHandler,
	studentHandler *interfaces.StudentHandler,
) {
	// Add CORS middleware first
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Add logger middleware
	r.Use(middleware.Logger(middleware.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	}))

	// Public routes
	api := r.Group("/api")
	{
		// Health check endpoint
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", middleware.AuthMiddleware(), authHandler.RefreshToken)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			users := protected.Group("/users")
			{
				users.GET("/me", userHandler.GetUserProfile)
				users.PUT("/me", userHandler.UpdateUserProfile)
				users.PATCH("/me/password", userHandler.UpdatePassword)
				users.POST("/me/avatar", userHandler.UploadProfilePicture)
			}

			// Tutor routes
			tutors := protected.Group("/tutors")
			{
				tutors.GET("", tutorHandler.ListTutors)
				tutors.POST("", tutorHandler.RegisterTutor)
				tutors.GET("/me", tutorHandler.GetTutorProfile)
				tutors.PUT("/me", tutorHandler.UpdateTutorProfile)
				tutors.PATCH("/:id/status", tutorHandler.UpdateTutorApprovalStatus)
				// Add search endpoint
				tutors.GET("/search", tutorHandler.SearchTutors)
			}

			// Student routes
			students := protected.Group("/students")
			{
				students.GET("/me", studentHandler.GetStudentProfile)
				students.PUT("/me", studentHandler.UpdateStudentProfile)
				students.PATCH("/me/streak", studentHandler.UpdateStudentStreak)
			}

			// Lesson routes
			lessons := protected.Group("/lessons")
			{
				lessons.GET("", lessonHandler.GetAllLessons)
				lessons.POST("", lessonHandler.BookLesson)
				lessons.GET("/:id", lessonHandler.GetLesson)
				lessons.DELETE("/:id", lessonHandler.CancelLesson)

				// Filter endpoints as query params rather than separate routes
				// These would now be used like: GET /api/lessons?status=upcoming
				// or GET /api/lessons?status=completed
			}
		}
	}

	// Setup static file serving
	r.Static("/uploads", "./uploads")
}

func NewRouter(
	authHandler *interfaces.AuthHandler,
	userHandler *interfaces.UserHandler,
	tutorHandler *interfaces.TutorHandler,
	lessonHandler *interfaces.LessonHandler,
	studentHandler *interfaces.StudentHandler,
) *gin.Engine {
	router := gin.Default()

	// Setup the router with all handlers
	SetupRouter(
		router,
		authHandler,
		tutorHandler,
		userHandler,
		lessonHandler,
		studentHandler,
	)

	return router
}
