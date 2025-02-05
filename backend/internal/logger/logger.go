package logger

import (
	"log/slog"
	"os"
	"time"

	"github.com/lmittmann/tint"
)

// LogLevel represents the logging level
type LogLevel string

const (
	DebugLevel LogLevel = "debug"
	InfoLevel  LogLevel = "info"
	WarnLevel  LogLevel = "warn"
	ErrorLevel LogLevel = "error"
)

// Logger is the global logger instance.
var Logger *slog.Logger

// LogConfig holds logger configuration
type LogConfig struct {
	Level      LogLevel
	TimeFormat string
	Output     string // "stdout", "stderr", or file path
}

// Init initializes the logger with the tint handler.
func Init() {
	initWithConfig(LogConfig{
		Level:      InfoLevel,
		TimeFormat: time.DateTime,
		Output:     "stderr",
	})
}

// InitWithConfig initializes the logger with custom configuration
func initWithConfig(config LogConfig) {
	var output *os.File
	switch config.Output {
	case "stdout":
		output = os.Stdout
	case "stderr":
		output = os.Stderr
	default:
		var err error
		output, err = os.OpenFile(config.Output, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			output = os.Stderr
		}
	}

	level := slog.LevelInfo
	switch config.Level {
	case DebugLevel:
		level = slog.LevelDebug
	case InfoLevel:
		level = slog.LevelInfo
	case WarnLevel:
		level = slog.LevelWarn
	case ErrorLevel:
		level = slog.LevelError
	}

	Logger = slog.New(tint.NewHandler(output, &tint.Options{
		Level:      level,
		TimeFormat: config.TimeFormat,
	}))
	slog.SetDefault(Logger)
}

// WithFields adds structured fields to the log entry
func WithFields(fields map[string]interface{}) *slog.Logger {
	args := make([]any, 0, len(fields)*2)
	for k, v := range fields {
		args = append(args, k, v)
	}
	return Logger.With(args...)
}

// Debug logs a debug message with structured fields
func Debug(msg string, args ...any) {
	if Logger != nil {
		Logger.Debug(msg, args...)
	}
}

// Info logs an info message with structured fields
func Info(msg string, args ...any) {
	if Logger != nil {
		Logger.Info(msg, args...)
	}
}

// Warn logs a warning message with structured fields
func Warn(msg string, args ...any) {
	if Logger != nil {
		Logger.Warn(msg, args...)
	}
}

// Error logs an error message with structured fields
func Error(msg string, args ...any) {
	if Logger != nil {
		Logger.Error(msg, args...)
	}
}

// Fatal logs a fatal message and exits
func Fatal(msg string, args ...any) {
	if Logger != nil {
		Logger.Error(msg, args...)
	}
	os.Exit(1)
}

// RequestLogger creates a logger with request-specific fields
func RequestLogger(requestID, method, path string) *slog.Logger {
	return WithFields(map[string]interface{}{
		"request_id": requestID,
		"method":     method,
		"path":       path,
	})
}

// DBLogger creates a logger with database-specific fields
func DBLogger(operation string) *slog.Logger {
	return WithFields(map[string]interface{}{
		"component": "database",
		"operation": operation,
	})
}

// AuthLogger creates a logger with authentication-specific fields
func AuthLogger(userID int, username string) *slog.Logger {
	return WithFields(map[string]interface{}{
		"component": "auth",
		"user_id":   userID,
		"username":  username,
	})
}
