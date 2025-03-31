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
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
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
			// Auth routes that require authentication
			protected.POST("/auth/refresh", authHandler.RefreshToken)

			// User profile routes
			protected.GET("/profile", userHandler.GetUserProfile)
			protected.PUT("/profile", userHandler.UpdateUserProfile)
			protected.PUT("/profile/password", userHandler.UpdatePassword)
			protected.POST("/profile/avatar", userHandler.UploadProfilePicture)

			// Tutor routes
			protected.POST("/tutors", tutorHandler.RegisterTutor)
			protected.GET("/tutors", tutorHandler.ListTutors)
			protected.PUT("/tutors/profile", tutorHandler.UpdateTutorProfile)
			protected.GET("/tutors/profile", tutorHandler.GetTutorProfile)
			protected.PUT("/tutors/:id/approval", tutorHandler.UpdateTutorApprovalStatus)

			// Student routes
			protected.GET("/students/profile", studentHandler.GetStudentProfile)
			protected.PUT("/students/profile", studentHandler.UpdateStudentProfile)
			protected.PUT("/students/streak", studentHandler.UpdateStudentStreak)

			// Lesson routes
			lessons := protected.Group("/lessons")
			{
				// List endpoints must come before parameterized routes
				lessons.GET("/upcoming", lessonHandler.GetUpcomingLessons)
				lessons.GET("/completed", lessonHandler.GetCompletedLessons)

				// Parameterized routes
				lessons.POST("", lessonHandler.BookLesson)
				lessons.GET("/:id", lessonHandler.GetLesson)
				lessons.POST("/:id/cancel", lessonHandler.CancelLesson)
			}
		}
	}
}

func NewRouter(
	authHandler *interfaces.AuthHandler,
	userHandler *interfaces.UserHandler,
	tutorHandler *interfaces.TutorHandler,
	lessonHandler *interfaces.LessonHandler,
	studentHandler *interfaces.StudentHandler,
) *gin.Engine {
	router := gin.Default()

	// Enable CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Serve static files from uploads directory
	router.Static("/uploads", "./uploads")

	// Public routes
	public := router.Group("/api")
	{
		// Auth routes
		public.POST("/auth/register", authHandler.Register)
		public.POST("/auth/login", authHandler.Login)
	}

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		// Auth routes that require authentication
		protected.POST("/auth/refresh", authHandler.RefreshToken)

		// User profile routes
		protected.GET("/profile", userHandler.GetUserProfile)
		protected.PUT("/profile", userHandler.UpdateUserProfile)
		protected.PUT("/profile/password", userHandler.UpdatePassword)
		protected.POST("/profile/avatar", userHandler.UploadProfilePicture)

		// Tutor routes
		protected.POST("/tutors", tutorHandler.RegisterTutor)
		protected.GET("/tutors", tutorHandler.ListTutors)
		protected.PUT("/tutors/profile", tutorHandler.UpdateTutorProfile)
		protected.GET("/tutors/profile", tutorHandler.GetTutorProfile)
		protected.PUT("/tutors/:id/approval", tutorHandler.UpdateTutorApprovalStatus)

		// Student routes
		protected.GET("/students/profile", studentHandler.GetStudentProfile)
		protected.PUT("/students/profile", studentHandler.UpdateStudentProfile)
		protected.PUT("/students/streak", studentHandler.UpdateStudentStreak)

		// Lesson routes
		protected.GET("/lessons/upcoming", lessonHandler.GetUpcomingLessons)
		protected.GET("/lessons/completed", lessonHandler.GetCompletedLessons)
		protected.POST("/lessons", lessonHandler.BookLesson)
		protected.GET("/lessons/:id", lessonHandler.GetLesson)
		protected.POST("/lessons/:id/cancel", lessonHandler.CancelLesson)
	}

	return router
}
