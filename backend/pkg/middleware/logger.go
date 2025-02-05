package middleware

import (
	"time"
	"tongly-backend/internal/logger"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LoggerConfig holds configuration for the logger middleware
type LoggerConfig struct {
	// Skip logging for paths
	SkipPaths []string
	// Skip logging for status codes
	SkipStatusCodes []int
}

// Logger returns a gin middleware for logging requests
func Logger(config ...LoggerConfig) gin.HandlerFunc {
	var cfg LoggerConfig
	if len(config) > 0 {
		cfg = config[0]
	}

	return func(c *gin.Context) {
		// Skip logging if path is in skip list
		for _, path := range cfg.SkipPaths {
			if path == c.Request.URL.Path {
				c.Next()
				return
			}
		}

		start := time.Now()
		requestID := uuid.New().String()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery
		if raw != "" {
			path = path + "?" + raw
		}

		// Create request-specific logger
		reqLogger := logger.RequestLogger(requestID, c.Request.Method, path)

		// Log request details
		reqLogger.Info("Request started",
			"client_ip", c.ClientIP(),
			"user_agent", c.Request.UserAgent(),
			"content_length", c.Request.ContentLength,
			"host", c.Request.Host,
			"protocol", c.Request.Proto,
		)

		// Add request ID to response headers
		c.Header("X-Request-ID", requestID)

		// Process request
		c.Next()

		// Get response status and size
		status := c.Writer.Status()
		size := c.Writer.Size()

		// Skip logging if status code is in skip list
		for _, code := range cfg.SkipStatusCodes {
			if code == status {
				return
			}
		}

		// Calculate duration
		duration := time.Since(start)

		// Get error if any
		var errs []string
		for _, err := range c.Errors {
			errs = append(errs, err.Error())
		}

		// Log response details
		fields := map[string]interface{}{
			"status":      status,
			"duration_ms": duration.Milliseconds(),
			"size":        size,
		}

		// Add errors if any
		if len(errs) > 0 {
			fields["errors"] = errs
		}

		// Log based on status code
		switch {
		case status >= 500:
			reqLogger.Error("Request failed", "fields", fields)
		case status >= 400:
			reqLogger.Warn("Request error", "fields", fields)
		case status >= 300:
			reqLogger.Info("Request redirected", "fields", fields)
		default:
			reqLogger.Info("Request completed", "fields", fields)
		}
	}
}
