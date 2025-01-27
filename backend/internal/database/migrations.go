package database

import (
	"database/sql"
	"fmt"
	"tongly/backend/internal/logger"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func dropAllTables(db *sql.DB) error {
	_, err := db.Exec(`
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

func RunMigrations(dbURL string, migrationsPath string) error {
	logger.Info("Running database migrations...")

	// First try to run migrations normally
	m, err := migrate.New(
		fmt.Sprintf("file://%s", migrationsPath),
		dbURL,
	)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err := m.Up(); err != nil {
		if err == migrate.ErrNoChange {
			logger.Info("No migrations to run")
			return nil
		}

		// If there's an error about existing tables, try force migration
		logger.Info("Tables already exist, attempting force migration...")

		// Connect to database to drop tables
		db, err := sql.Open("postgres", dbURL)
		if err != nil {
			return fmt.Errorf("failed to connect to database: %w", err)
		}
		defer db.Close()

		// Drop all tables
		if err := dropAllTables(db); err != nil {
			return fmt.Errorf("failed to drop tables: %w", err)
		}

		// Create new migrate instance
		m, err = migrate.New(
			fmt.Sprintf("file://%s", migrationsPath),
			dbURL,
		)
		if err != nil {
			return fmt.Errorf("failed to create new migrate instance: %w", err)
		}
		defer m.Close()

		// Try migrations again
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			return fmt.Errorf("failed to run force migrations: %w", err)
		}
	}

	logger.Info("Database migrations completed successfully")
	return nil
}
