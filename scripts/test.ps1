# Set error handling
$ErrorActionPreference = "Stop"

Write-Host "Running all tests..."

Write-Host "`nRunning Backend Tests..."
Set-Location backend
# Install backend dependencies if needed
go get -u github.com/stretchr/testify/assert
go get -u github.com/golang-jwt/jwt

# Create test database
$env:PGPASSWORD = "postgres"
& psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS tongly_test;"
& psql -U postgres -h localhost -c "CREATE DATABASE tongly_test;"

# Run migrations and tests
go run cmd/migrate/main.go -env test
go test ./... -v

Write-Host "`nRunning Frontend Tests..."
Set-Location ../frontend
# Install frontend dependencies if needed
npm install --silent
npm test -- --watchAll=false

Write-Host "`nAll tests completed!"

# Return to original directory
Set-Location .. 