package database

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func RunMigrations(db *sql.DB, migrationsPath string) error {
	// Get the absolute path to migrations
	_, b, _, _ := runtime.Caller(0)
	basepath := filepath.Dir(filepath.Dir(filepath.Dir(b)))
	absolutePath := filepath.Join(basepath, migrationsPath)

	// Convert Windows path to URL format
	fileURL := "file://" + strings.ReplaceAll(absolutePath, "\\", "/")

	fmt.Printf("Running migrations from: %s\n", fileURL) // Debug line

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("could not create migration driver: %w", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		fileURL,
		"postgres",
		driver,
	)
	if err != nil {
		return fmt.Errorf("could not create migrate instance: %w", err)
	}

	// Force the version to 0 before running migrations
	if err := m.Force(0); err != nil {
		return fmt.Errorf("could not force migration version: %w", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return fmt.Errorf("could not run migrations: %w", err)
	}

	return nil
}
