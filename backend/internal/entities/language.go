package entities

import "time"

// Language represents a language in the system
type Language struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// LanguageProficiency represents a language proficiency level
type LanguageProficiency struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// UserLanguage represents a user's language proficiency
type UserLanguage struct {
	UserID        int                  `json:"user_id"`
	LanguageID    int                  `json:"language_id"`
	ProficiencyID int                  `json:"proficiency_id"`
	Language      *Language            `json:"language,omitempty"`
	Proficiency   *LanguageProficiency `json:"proficiency,omitempty"`
	CreatedAt     time.Time            `json:"created_at"`
}
