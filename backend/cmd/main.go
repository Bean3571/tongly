package main

import (
	"log"
	"tongly-basic/backend/internal/config"
	"tongly-basic/backend/internal/database"
	"tongly-basic/backend/internal/interfaces"
	"tongly-basic/backend/internal/repositories"
	"tongly-basic/backend/internal/router"
	"tongly-basic/backend/internal/usecases"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Run migrations
	if err := database.RunMigrations(cfg); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Initialize repositories
	userRepo := repositories.NewUserRepositoryImpl(db)
	tutorRepo := repositories.NewTutorRepository(db)

	// Initialize usecases
	authUseCase := usecases.NewAuthUseCase(userRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)
	tutorUseCase := usecases.NewTutorUseCase(tutorRepo, userRepo)
	gamificationUseCase := usecases.NewGamificationUseCase()

	// Initialize handlers
	authHandler := interfaces.NewAuthHandler(authUseCase)
	userHandler := interfaces.NewUserHandler(userUseCase)
	tutorHandler := interfaces.NewTutorHandler(tutorUseCase)
	gamificationHandler := interfaces.NewGamificationHandler(gamificationUseCase)

	// Setup router
	r := gin.Default()
	router.SetupRouter(r, authHandler, tutorHandler, userHandler, gamificationHandler)

	// Start server
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
