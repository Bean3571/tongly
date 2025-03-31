package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
	"tongly-backend/internal/config"
	"tongly-backend/internal/database"
	"tongly-backend/internal/interfaces"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
	"tongly-backend/internal/usecases"
	"tongly-backend/pkg/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	// Initialize the logger
	logger.Init()
	logger.Info("Starting Tongly backend server...")

	// Load config
	cfg := config.LoadConfig()

	// Create database URL
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	// Run migrations before connecting to the database
	migrationsPath := filepath.Join("migrations")
	if err := database.RunMigrations(dbURL, migrationsPath); err != nil {
		logger.Error("Failed to run migrations", "error", err)
		return
	}

	// Initialize database connection
	dbConfig := &database.Config{
		Host:     cfg.DBHost,
		Port:     cfg.DBPort,
		User:     cfg.DBUser,
		Password: cfg.DBPassword,
		DBName:   cfg.DBName,
		SSLMode:  cfg.DBSSLMode,
	}

	db, err := database.NewConnection(dbConfig)
	if err != nil {
		logger.Error("Failed to connect to database", "error", err)
		return
	}
	defer db.Close()

	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	tutorRepo := repositories.NewTutorRepository(db)
	lessonRepo := repositories.NewLessonRepository(db)
	studentRepo := repositories.NewStudentRepository(db)

	// Initialize use cases
	authUseCase := usecases.NewAuthUseCase(userRepo)
	tutorUseCase := usecases.NewTutorUseCase(tutorRepo, userRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)
	lessonUseCase := usecases.NewLessonUseCase(
		lessonRepo,
		tutorRepo,
		userRepo,
	)
	studentUseCase := usecases.NewStudentUseCase(studentRepo, userRepo)

	// Initialize handlers
	authHandler := interfaces.NewAuthHandler(authUseCase, tutorUseCase)
	tutorHandler := interfaces.NewTutorHandler(tutorUseCase)
	userHandler := interfaces.NewUserHandler(userUseCase)
	lessonHandler := interfaces.NewLessonHandler(lessonUseCase)
	studentHandler := interfaces.NewStudentHandler(studentUseCase)

	// Create a new Gin router with recommended production settings
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger(middleware.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	}))

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders,
		"Authorization",
	)
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	r.Use(cors.New(config))

	// Ensure uploads directories exist
	os.MkdirAll("uploads/avatars", 0755)

	// Register static file routes
	r.Static("/uploads", "./uploads")

	// Register health check route
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Register all handler routes
	authHandler.RegisterRoutes(r)
	userHandler.RegisterRoutes(r)
	tutorHandler.RegisterRoutes(r)
	studentHandler.RegisterRoutes(r)
	lessonHandler.RegisterRoutes(r)

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	go func() {
		logger.Info("Server started", "port", cfg.ServerPort)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Failed to start server", "error", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		logger.Error("Server forced to shutdown", "error", err)
	}

	logger.Info("Server exited")
}
