package testutil

import (
	"database/sql"
	"testing"

	_ "github.com/lib/pq"
)

func SetupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("postgres", "postgres://postgres:postgres@localhost:5432/tongly_test?sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	// Clear all tables before each test
	_, err = db.Exec(`
        DO $$ 
        BEGIN
            EXECUTE (
                SELECT 'TRUNCATE TABLE ' || string_agg(quote_ident(tablename), ', ') || ' CASCADE'
                FROM pg_tables
                WHERE schemaname = 'public'
            );
        END $$;
    `)
	if err != nil {
		t.Fatalf("Failed to clear test database: %v", err)
	}

	return db
}
