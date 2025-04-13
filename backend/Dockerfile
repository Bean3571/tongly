FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go.mod and go.sum files to download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire codebase
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -o tongly-server ./cmd/server

# Create the final lightweight image
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/tongly-server .
COPY --from=builder /app/migrations ./migrations

# Create directories
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
RUN mkdir -p /app/certs

# Set environment variables
ENV DB_HOST=db
ENV DB_PORT=5432
ENV DB_USER=user
ENV DB_PASSWORD=password
ENV DB_NAME=tongly
ENV DB_SSLMODE=disable
ENV JWT_SECRET=supersecretkey
ENV SERVER_PORT=8080
ENV USE_SSL=true

EXPOSE 8080

CMD ["./tongly-server"] 