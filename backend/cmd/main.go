package main

import (
	"path/filepath"
	"tongly/backend/internal/config"
	"tongly/backend/internal/database"
	"tongly/backend/internal/interfaces"
	"tongly/backend/internal/logger"
	"tongly/backend/internal/repositories"
	"tongly/backend/internal/router"
	"tongly/backend/internal/usecases"

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

	// Run migrations
	migrationsPath := filepath.Join("migrations")
	if err := database.RunMigrations(db, migrationsPath); err != nil {
		logger.Error("Failed to run migrations", "error", err)
		return
	}

	// Initialize repositories
	userRepo := &repositories.UserRepositoryImpl{DB: db}
	tutorRepo := &repositories.TutorRepositoryImpl{DB: db}
	challengeRepo := &repositories.ChallengeRepositoryImpl{DB: db}

	// Initialize use cases
	authUseCase := usecases.AuthUseCase{UserRepo: userRepo}
	tutorUseCase := usecases.TutorUseCase{TutorRepo: tutorRepo}
	gamificationUseCase := usecases.GamificationUseCase{ChallengeRepo: challengeRepo}

	// Initialize handlers
	authHandler := interfaces.AuthHandler{AuthUseCase: authUseCase}
	tutorHandler := interfaces.TutorHandler{TutorUseCase: tutorUseCase}
	gamificationHandler := interfaces.GamificationHandler{GamificationUseCase: gamificationUseCase}

	// Create a new Gin router
	r := gin.Default()

	// Enable CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},                   // Allow frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}, // Include OPTIONS
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// Register routes using the SetupRouter function
	router.SetupRouter(r, &authHandler, &tutorHandler, &gamificationHandler)

	// Start server
	logger.Info("Server started", "port", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		logger.Error("Failed to start server", "error", err)
	}
}
