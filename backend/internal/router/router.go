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
	walletHandler *interfaces.WalletHandler,
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

			// Lesson routes
			lessons := protected.Group("/lessons")
			{
				// List endpoints must come before parameterized routes
				lessons.GET("/upcoming", lessonHandler.GetLessons)
				lessons.GET("/completed", lessonHandler.GetLessons)

				// Parameterized routes
				lessons.POST("", lessonHandler.BookLesson)
				lessons.GET("/:id", lessonHandler.GetLesson)
				lessons.POST("/:id/cancel", lessonHandler.CancelLesson)
			}

			// Wallet routes
			wallet := protected.Group("/wallet")
			{
				wallet.GET("/balance", walletHandler.GetBalance)
				wallet.GET("/transactions", walletHandler.GetTransactionHistory)
				wallet.POST("/deposit", walletHandler.ProcessDeposit)
				wallet.POST("/withdraw", walletHandler.ProcessWithdrawal)
			}
		}
	}
}

func NewRouter(
	authHandler *interfaces.AuthHandler,
	userHandler *interfaces.UserHandler,
	tutorHandler *interfaces.TutorHandler,
	lessonHandler *interfaces.LessonHandler,
	walletHandler *interfaces.WalletHandler,
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

		// Lesson routes
		protected.GET("/lessons/upcoming", lessonHandler.GetLessons)
		protected.GET("/lessons/completed", lessonHandler.GetLessons)
		protected.POST("/lessons", lessonHandler.BookLesson)
		protected.GET("/lessons/:id", lessonHandler.GetLesson)
		protected.POST("/lessons/:id/cancel", lessonHandler.CancelLesson)

		// Wallet routes
		wallet := protected.Group("/wallet")
		{
			wallet.GET("/balance", walletHandler.GetBalance)
			wallet.GET("/transactions", walletHandler.GetTransactionHistory)
			wallet.POST("/deposit", walletHandler.ProcessDeposit)
			wallet.POST("/withdraw", walletHandler.ProcessWithdrawal)
		}
	}

	return router
}
