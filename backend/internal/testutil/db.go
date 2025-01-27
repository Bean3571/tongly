package testutil

import (
	"database/sql"
	"fmt"
	"os"
	"testing"
)

func SetupTestDB(t *testing.T) *sql.DB {
	dbHost := os.Getenv("TEST_DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}

	connStr := fmt.Sprintf(
		"host=%s port=5432 user=user password=password dbname=tongly_test sslmode=disable",
		dbHost,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	return db
}

func CleanupTestDB(t *testing.T, db *sql.DB) {
	_, err := db.Exec(`
        DO $$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END $$;
    `)
	if err != nil {
		t.Errorf("Failed to cleanup test database: %v", err)
	}
}
