#!/bin/bash

# Set error handling
set -e

echo "🧪 Running all tests..."

echo "📝 Running Backend Tests..."
cd backend || exit
# Install backend dependencies if needed
go get -u github.com/stretchr/testify/assert
go get -u github.com/golang-jwt/jwt

# Create test database using Windows path to psql
PGPASSWORD=postgres "/c/Program Files/PostgreSQL/16/bin/psql" -U postgres -h localhost -c "DROP DATABASE IF EXISTS tongly_test;" || true
PGPASSWORD=postgres "/c/Program Files/PostgreSQL/16/bin/psql" -U postgres -h localhost -c "CREATE DATABASE tongly_test;" || true

# Run migrations and tests
go run cmd/migrate/main.go -env test
go test ./... -v

echo "🌐 Running Frontend Tests..."
cd ../frontend || exit
# Install frontend dependencies if needed
npm install --silent
npm test -- --watchAll=false

echo "✅ All tests completed!"