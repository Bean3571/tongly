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
	gamificationHandler *interfaces.GamificationHandler,
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
			protected.POST("/tutors/video", tutorHandler.UploadVideo)
			protected.GET("/tutors/:id/rating", lessonHandler.GetTutorRating)

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
				lessons.POST("/:id/video/start", lessonHandler.StartVideoSession)
				lessons.POST("/:id/video/end", lessonHandler.EndVideoSession)
				lessons.GET("/:id/video", lessonHandler.GetVideoSession)
				lessons.POST("/:id/chat", lessonHandler.SendChatMessage)
				lessons.GET("/:id/chat", lessonHandler.GetChatHistory)
				lessons.POST("/:id/rate", lessonHandler.RateLesson)
			}

			// Gamification routes
			protected.POST("/challenges/submit", gamificationHandler.SubmitChallenge)
			protected.GET("/leaderboards", gamificationHandler.GetLeaderboard)

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
	gamificationHandler *interfaces.GamificationHandler,
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
		protected.POST("/tutors/video", tutorHandler.UploadVideo)

		// Lesson routes
		protected.GET("/lessons/upcoming", lessonHandler.GetUpcomingLessons)
		protected.GET("/lessons/completed", lessonHandler.GetCompletedLessons)
		protected.POST("/lessons", lessonHandler.BookLesson)
		protected.GET("/lessons/:id", lessonHandler.GetLesson)
		protected.POST("/lessons/:id/cancel", lessonHandler.CancelLesson)
		protected.POST("/lessons/:id/video/start", lessonHandler.StartVideoSession)
		protected.POST("/lessons/:id/video/end", lessonHandler.EndVideoSession)
		protected.GET("/lessons/:id/video", lessonHandler.GetVideoSession)
		protected.POST("/lessons/:id/chat", lessonHandler.SendChatMessage)
		protected.GET("/lessons/:id/chat", lessonHandler.GetChatHistory)
		protected.POST("/lessons/:id/rate", lessonHandler.RateLesson)

		// Gamification routes
		protected.POST("/challenges/submit", gamificationHandler.SubmitChallenge)
		protected.GET("/leaderboards", gamificationHandler.GetLeaderboard)

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
