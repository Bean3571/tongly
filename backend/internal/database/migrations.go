package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
)

func RunMigrations(db *sql.DB, migrationsPath string) error {
	// Get absolute path to migrations directory
	absPath, err := filepath.Abs(migrationsPath)
	if err != nil {
		return fmt.Errorf("could not get absolute path: %w", err)
	}

	// Verify the migrations directory exists
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		return fmt.Errorf("migrations directory does not exist: %s", absPath)
	}

	// Drop all existing tables
	_, err = db.Exec(`
		DO $$ DECLARE
			r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
				EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
			END LOOP;
		END $$;
	`)
	if err != nil {
		return fmt.Errorf("could not drop existing tables: %w", err)
	}
	fmt.Println("Dropped all existing tables")

	// Read and execute the up migration file
	upMigrationPath := filepath.Join(absPath, "001_initial_schema.up.sql")
	migrationSQL, err := os.ReadFile(upMigrationPath)
	if err != nil {
		return fmt.Errorf("could not read migration file: %w", err)
	}

	// Execute the migration within a transaction
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("could not begin transaction: %w", err)
	}

	_, err = tx.Exec(string(migrationSQL))
	if err != nil {
		tx.Rollback()
		return fmt.Errorf("could not execute migration: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("could not commit transaction: %w", err)
	}

	// Verify tables were created
	var tableCount int
	err = db.QueryRow(`
		SELECT COUNT(table_name) 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		AND table_type = 'BASE TABLE'
	`).Scan(&tableCount)
	if err != nil {
		return fmt.Errorf("could not verify tables: %w", err)
	}
	fmt.Printf("Number of tables created: %d\n", tableCount)

	return nil
}
