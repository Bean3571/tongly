package entities

import "time"

// Emoji represents an emoji with its name in different languages
type Emoji struct {
	ID        int       `json:"id"`
	Emoji     string    `json:"emoji"`
	NameEN    string    `json:"name_en"`
	NameES    string    `json:"name_es"`
	NameRU    string    `json:"name_ru"`
	CreatedAt time.Time `json:"created_at"`
}

// GameResult represents a result of a game played by a user
type GameResult struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	GameType    string    `json:"game_type"`
	LanguageID  int       `json:"language_id"`
	Score       int       `json:"score"`
	CompletedAt time.Time `json:"completed_at"`

	// Related entities (not in database)
	User     *User     `json:"user,omitempty"`
	Language *Language `json:"language,omitempty"`
}

// GameQuestion represents a question for the games
type GameQuestion struct {
	Emoji         string   `json:"emoji"`
	CorrectAnswer string   `json:"correct_answer"`
	Options       []string `json:"options,omitempty"` // Only for quiz game
}

// GameQuestionSet represents a set of questions for a game
type GameQuestionSet struct {
	Language  string         `json:"language"`
	Questions []GameQuestion `json:"questions"`
}

// LeaderboardEntry represents an entry in the leaderboard
type LeaderboardEntry struct {
	UserID        int    `json:"user_id"`
	Username      string `json:"username"`
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	TotalScore    int    `json:"total_score"`
	CurrentStreak int    `json:"current_streak"`
	LongestStreak int    `json:"longest_streak"`
	Rank          int    `json:"rank"`
}

// SaveGameResultRequest represents the request to save a game result
type SaveGameResultRequest struct {
	GameType   string `json:"game_type" validate:"required,oneof=emoji_quiz emoji_typing"`
	LanguageID int    `json:"language_id" validate:"required"`
	Score      int    `json:"score" validate:"required,min=0,max=100"`
}
