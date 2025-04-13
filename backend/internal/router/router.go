package router

import (
	interfaces "tongly-backend/internal/handlers"
	"tongly-backend/internal/logger"
	"tongly-backend/pkg/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(
	r *gin.Engine,
	authHandler *interfaces.AuthHandler,
	studentHandler *interfaces.StudentHandler,
	tutorHandler *interfaces.TutorHandler,
	lessonHandler *interfaces.LessonHandler,
	commonHandler *interfaces.CommonHandler,
	userHandler *interfaces.UserHandler,
	preferencesHandler *interfaces.UserPreferencesHandler,
) {
	// Add CORS middleware first
	r.Use(cors.New(cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
		AllowOriginFunc: func(origin string) bool {
			allowed := false
			for _, allowedOrigin := range []string{
				"https://192.168.0.100:3000",
				"https://192.168.0.106:3000",
				"https://192.168.0.107:3000",
				"https://192.168.0.108:3000",
				"https://localhost:3000",
				"http://localhost:3000",
			} {
				if origin == allowedOrigin {
					allowed = true
					break
				}
			}
			if !allowed {
				logger.Info("CORS request blocked", "origin", origin)
			}
			return allowed
		},
	}))

	// Add logger middleware
	r.Use(middleware.Logger(middleware.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	}))

	// Common routes (public)
	commonHandler.RegisterRoutes(r)

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
			// Register all other routes through their handlers
			studentHandler.RegisterRoutes(r)
			tutorHandler.RegisterRoutes(r)
			lessonHandler.RegisterRoutes(r)
			userHandler.RegisterRoutes(r)
			preferencesHandler.RegisterRoutes(r)
		}
	}

	// Setup static file serving
	r.Static("/uploads", "./uploads")
}

func NewRouter(
	authHandler *interfaces.AuthHandler,
	studentHandler *interfaces.StudentHandler,
	tutorHandler *interfaces.TutorHandler,
	lessonHandler *interfaces.LessonHandler,
	commonHandler *interfaces.CommonHandler,
	userHandler *interfaces.UserHandler,
	preferencesHandler *interfaces.UserPreferencesHandler,
) *gin.Engine {
	router := gin.Default()

	// Setup the router with all handlers
	SetupRouter(
		router,
		authHandler,
		studentHandler,
		tutorHandler,
		lessonHandler,
		commonHandler,
		userHandler,
		preferencesHandler,
	)

	return router
}
