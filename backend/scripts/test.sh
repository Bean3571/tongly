#!/bin/bash

# Create test database if it doesn't exist
PGPASSWORD=postgres psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS tongly_test;"
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE tongly_test;"

# Run migrations on test database
go run cmd/migrate/main.go -env test

# Run tests
go test ./... -v 