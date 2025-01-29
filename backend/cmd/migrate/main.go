package main

import (
	"database/sql"
	"flag"
	"fmt"
	"os"
	"tongly-basic/backend/internal/config"
	"tongly-basic/backend/internal/logger"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func dropAllTables(dbURL string) error {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(`
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
				EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
			END LOOP;
		END $$;
	`)
	return err
}

func main() {
	logger.Init()

	// Parse command line flags
	env := flag.String("env", "development", "Environment (development/test)")
	command := flag.String("command", "up", "Migration command (up/down)")
	force := flag.Bool("force", false, "Force drop all tables before migration")
	flag.Parse()

	// Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		logger.Error("Failed to load config", "error", err)
		os.Exit(1)
	}

	// Use test database if env is test
	if *env == "test" {
		cfg.DBName = "tongly_test"
	}

	// Create database URL
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSLMode,
	)

	// If force flag is set, drop all tables first
	if *force {
		logger.Info("Force flag set, dropping all tables...")
		if err := dropAllTables(dbURL); err != nil {
			logger.Error("Failed to drop tables", "error", err)
			os.Exit(1)
		}
		logger.Info("All tables dropped successfully")
	}

	// Create a new migrate instance
	m, err := migrate.New(
		"file://migrations",
		dbURL,
	)
	if err != nil {
		logger.Error("Failed to create migrate instance", "error", err)
		os.Exit(1)
	}
	defer m.Close()

	// Run the specified command
	switch *command {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			logger.Error("Failed to run migrations", "error", err)
			os.Exit(1)
		}
	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			logger.Error("Failed to rollback migrations", "error", err)
			os.Exit(1)
		}
	default:
		logger.Error("Invalid command", "command", *command)
		os.Exit(1)
	}

	logger.Info("Migration command completed successfully", "command", *command)
}
