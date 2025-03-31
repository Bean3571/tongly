package entities

import "time"

// Language represents a language in the system
type Language struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// LanguageLevel is deprecated: Only kept for compatibility with existing code
type LanguageLevel struct {
	Language string `json:"language"`
	Level    string `json:"level"`
}

// Deprecated language list
var Languages = []string{
	"English", "Spanish", "French", "German", "Chinese", "Japanese",
	"Korean", "Russian", "Arabic", "Portuguese", "Italian",
}

// Deprecated language levels (CEFR)
var LanguageLevels = []string{
	"A1", "A2", "B1", "B2", "C1", "C2",
}
