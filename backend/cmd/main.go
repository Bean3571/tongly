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
	"tongly-backend/internal/router"
	"tongly-backend/internal/services"
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
	userRepo := &repositories.UserRepositoryImpl{DB: db}
	challengeRepo := &repositories.ChallengeRepositoryImpl{DB: db}
	tutorRepo := &repositories.TutorRepositoryImpl{DB: db}
	lessonRepo := repositories.NewLessonRepository(db)
	walletRepo := repositories.NewWalletRepository(db)

	// Initialize use cases and services
	authUseCase := usecases.AuthUseCase{UserRepo: userRepo}
	tutorUseCase := &usecases.TutorUseCase{UserRepo: userRepo}
	gamificationUseCase := usecases.GamificationUseCase{ChallengeRepo: challengeRepo}
	userUseCase := usecases.UserUseCase{UserRepo: userRepo}
	lessonUseCase := usecases.NewLessonUseCase(lessonRepo, tutorRepo, userRepo)
	walletService := services.NewWalletService(walletRepo, lessonRepo)

	// Initialize handlers
	authHandler := interfaces.NewAuthHandler(&authUseCase, tutorUseCase)
	tutorHandler := interfaces.TutorHandler{TutorUseCase: tutorUseCase}
	gamificationHandler := interfaces.GamificationHandler{GamificationUseCase: gamificationUseCase}
	userHandler := interfaces.UserHandler{UserUseCase: userUseCase}
	lessonHandler := interfaces.NewLessonHandler(lessonUseCase)
	webrtcHandler := interfaces.NewWebRTCHandler(lessonUseCase)
	walletHandler := interfaces.NewWalletHandler(walletService)

	// Create a new Gin router with recommended production settings
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger(middleware.LoggerConfig{
		SkipPaths: []string{"/health", "/metrics"},
	}))

	// CORS configuration with WebSocket support
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders,
		"Authorization",
		"Sec-WebSocket-Protocol",
		"Sec-WebSocket-Version",
		"Sec-WebSocket-Key",
		"Sec-WebSocket-Extensions",
		"Upgrade",
		"Connection",
	)
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.ExposeHeaders = []string{"Content-Length", "Sec-WebSocket-Accept"}
	r.Use(cors.New(config))

	// Register WebRTC routes first (before other routes)
	webrtcHandler.RegisterRoutes(r)

	// Register other routes
	router.SetupRouter(r, authHandler, &tutorHandler, &gamificationHandler, &userHandler, lessonHandler, walletHandler)

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
