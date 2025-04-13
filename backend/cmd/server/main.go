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
	prefsRepo := repositories.NewUserPreferencesRepository(db)
	gameRepo := repositories.NewGameRepository(db)

	// Initialize usecases
	authUseCase := usecases.NewAuthUseCase(userRepo, studentRepo, tutorRepo)
	studentUseCase := usecases.NewStudentUseCase(studentRepo, userRepo, lessonRepo)
	tutorUseCase := usecases.NewTutorUseCase(tutorRepo, userRepo, studentRepo, lessonRepo)
	lessonUseCase := usecases.NewLessonUseCase(lessonRepo, userRepo, tutorRepo, studentRepo, langRepo)
	commonUseCase := usecases.NewCommonUseCase(langRepo, interestRepo, goalRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)
	prefsUseCase := usecases.NewUserPreferencesUseCase(prefsRepo, langRepo, interestRepo, goalRepo)
	gameUseCase := usecases.NewGameUseCase(gameRepo, langRepo)

	// Initialize handlers
	authHandler := interfaces.NewAuthHandler(*authUseCase, tutorUseCase, studentUseCase)
	studentHandler := interfaces.NewStudentHandler(studentUseCase)
	tutorHandler := interfaces.NewTutorHandler(tutorUseCase)
	lessonHandler := interfaces.NewLessonHandler(lessonUseCase)
	commonHandler := interfaces.NewCommonHandler(commonUseCase)
	userHandler := interfaces.NewUserHandler(userUseCase)
	preferencesHandler := interfaces.NewUserPreferencesHandler(prefsUseCase)
	gameHandler := interfaces.NewGameHandler(gameUseCase)

	// Create a new Gin router with recommended production settings
	gin.SetMode(gin.ReleaseMode)
	r := router.NewRouter(
		authHandler,
		studentHandler,
		tutorHandler,
		lessonHandler,
		commonHandler,
		userHandler,
		preferencesHandler,
		gameHandler,
	)

	// Ensure uploads directories exist
	os.MkdirAll("uploads/avatars", 0755)

	// Start server with graceful shutdown
	srv := &http.Server{
		Addr:    ":" + cfg.ServerPort,
		Handler: r,
	}

	// Check if SSL is enabled in configuration
	useSSL := cfg.UseSSL

	go func() {
		var err error
		if useSSL {
			// Use absolute path to certificates
			workDir, _ := os.Getwd()
			certsDir := filepath.Join(workDir, "..", "certs")
			certFile := filepath.Join(certsDir, "cert.pem")
			keyFile := filepath.Join(certsDir, "key.pem")

			// Check if cert files exist
			if _, certErr := os.Stat(certFile); certErr != nil {
				logger.Error("Certificate file not found", "path", certFile, "error", certErr)
			} else {
				logger.Info("Found certificate file", "path", certFile)
			}

			if _, keyErr := os.Stat(keyFile); keyErr != nil {
				logger.Error("Key file not found", "path", keyFile, "error", keyErr)
			} else {
				logger.Info("Found key file", "path", keyFile)
			}

			logger.Info("Server started with HTTPS", "port", cfg.ServerPort, "certsDir", certsDir)
			err = srv.ListenAndServeTLS(certFile, keyFile)
		} else {
			logger.Info("Server started with HTTP", "port", cfg.ServerPort)
			err = srv.ListenAndServe()
		}

		if err != nil && err != http.ErrServerClosed {
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
