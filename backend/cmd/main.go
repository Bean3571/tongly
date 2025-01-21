package main

import (
	"database/sql"
	"log"
	"tongly/backend/internal/config"
	"tongly/backend/internal/interfaces"
	"tongly/backend/internal/repositories"
	"tongly/backend/internal/router"
	"tongly/backend/internal/usecases"

	_ "github.com/lib/pq"
)

func main() {
	// Load config
	cfg := config.LoadConfig()

	// Connect to database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Initialize repositories
	userRepo := &repositories.UserRepositoryImpl{DB: db}           // Use a pointer
	tutorRepo := &repositories.TutorRepositoryImpl{DB: db}         // Use a pointer
	challengeRepo := &repositories.ChallengeRepositoryImpl{DB: db} // Use a pointer

	// Initialize use cases
	authUseCase := usecases.AuthUseCase{UserRepo: userRepo}
	tutorUseCase := usecases.TutorUseCase{TutorRepo: tutorRepo}
	gamificationUseCase := usecases.GamificationUseCase{ChallengeRepo: challengeRepo}

	// Initialize handlers
	authHandler := interfaces.AuthHandler{AuthUseCase: authUseCase}
	tutorHandler := interfaces.TutorHandler{TutorUseCase: tutorUseCase}
	gamificationHandler := interfaces.GamificationHandler{GamificationUseCase: gamificationUseCase}

	// Setup router
	r := router.SetupRouter(&authHandler, &tutorHandler, &gamificationHandler)

	// Start server
	log.Printf("Server started on port %s", cfg.ServerPort)
	if err := r.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
