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
	interfaces "tongly-backend/internal/handlers"
	"tongly-backend/internal/logger"
	"tongly-backend/internal/repositories"
	"tongly-backend/internal/router"
	"tongly-backend/internal/usecases"

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
	studentRepo := repositories.NewStudentRepository(db)
	tutorRepo := repositories.NewTutorRepository(db)
	lessonRepo := repositories.NewLessonRepository(db)
	langRepo := repositories.NewLanguageRepository(db)
	interestRepo := repositories.NewInterestRepository(db)
	goalRepo := repositories.NewGoalRepository(db)

	// Initialize usecases
	authUseCase := usecases.NewAuthUseCase(userRepo, studentRepo, tutorRepo)
	studentUseCase := usecases.NewStudentUseCase(studentRepo, userRepo, lessonRepo)
	tutorUseCase := usecases.NewTutorUseCase(tutorRepo, userRepo, studentRepo, lessonRepo)
	lessonUseCase := usecases.NewLessonUseCase(lessonRepo, userRepo, tutorRepo, studentRepo, langRepo)
	commonUseCase := usecases.NewCommonUseCase(langRepo, interestRepo, goalRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)

	// Initialize handlers
	authHandler := interfaces.NewAuthHandler(*authUseCase, tutorUseCase, studentUseCase)
	studentHandler := interfaces.NewStudentHandler(studentUseCase)
	tutorHandler := interfaces.NewTutorHandler(tutorUseCase)
	lessonHandler := interfaces.NewLessonHandler(lessonUseCase)
	commonHandler := interfaces.NewCommonHandler(commonUseCase)
	userHandler := interfaces.NewUserHandler(userUseCase)

	// Create a new Gin router with recommended production settings
	gin.SetMode(gin.ReleaseMode)
	r := router.NewRouter(
		authHandler,
		studentHandler,
		tutorHandler,
		lessonHandler,
		commonHandler,
		userHandler,
	)

	// Ensure uploads directories exist
	os.MkdirAll("uploads/avatars", 0755)

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
