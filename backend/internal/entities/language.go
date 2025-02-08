package entities

// LanguageLevel represents a language and its proficiency level
type LanguageLevel struct {
	Language string `json:"language"`
	Level    string `json:"level"`
}

// Language options
var Languages = []string{
	"English", "Spanish", "French", "German", "Chinese", "Japanese",
	"Korean", "Russian", "Arabic", "Portuguese", "Italian",
}

// Language levels (CEFR)
var LanguageLevels = []string{
	"A1", "A2", "B1", "B2", "C1", "C2",
}
