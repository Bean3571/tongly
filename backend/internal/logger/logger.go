package logger

import (
	"log/slog"
	"os"
	"time"

	"github.com/lmittmann/tint"
)

// Logger is the global logger instance.
var Logger *slog.Logger

// Init initializes the logger with the tint handler.
func Init() {
	Logger = slog.New(tint.NewHandler(os.Stderr, &tint.Options{
		Level:      slog.LevelDebug, // Log level (Debug, Info, Warn, Error)
		TimeFormat: time.DateTime,   // Custom time format
	}))
	slog.SetDefault(Logger)
}

// Debug logs a debug message.
func Debug(msg string, args ...any) {
	if Logger != nil {
		Logger.Debug(msg, args...)
	}
}

// Info logs an info message.
func Info(msg string, args ...any) {
	if Logger != nil {
		Logger.Info(msg, args...)
	}
}

// Warn logs a warning message.
func Warn(msg string, args ...any) {
	if Logger != nil {
		Logger.Warn(msg, args...)
	}
}

// Error logs an error message.
func Error(msg string, args ...any) {
	if Logger != nil {
		Logger.Error(msg, args...)
	}
}
