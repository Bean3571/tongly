FROM golang:1.23.5-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go.mod and go.sum files to download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire codebase
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -o video-service ./cmd/main.go

# Create the final lightweight image
FROM alpine:latest

WORKDIR /app

# Copy binary from the builder stage
COPY --from=builder /app/video-service .

# Copy necessary directories and files
COPY --from=builder /app/views ./views

# Create certs directory
RUN mkdir -p /app/certs

EXPOSE 8081

# Use ENV to set the server address
ENV ADDR=0.0.0.0:8081
ENV CERT_FILE=/app/certs/cert.pem
ENV KEY_FILE=/app/certs/key.pem

CMD ["./video-service"] 