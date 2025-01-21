package main

import (
	"database/sql"
	"log"
	"tongly/backend/internal/config"
	"tongly/backend/internal/interfaces"
	"tongly/backend/internal/repositories"
	"tongly/backend/internal/usecases"

	"github.com/gin-gonic/gin"
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
	userRepo := repositories.UserRepository{DB: db}

	// Initialize use cases
	authUseCase := usecases.AuthUseCase{UserRepo: userRepo}

	// Initialize handlers
	authHandler := interfaces.AuthHandler{AuthUseCase: authUseCase}

	// Setup router
	router := gin.Default()
	router.POST("/api/auth/register", authHandler.Register)

	// Start server
	log.Printf("Server started on port %s", cfg.ServerPort)
	if err := router.Run(":" + cfg.ServerPort); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
