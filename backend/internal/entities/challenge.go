package entities

type Challenge struct {
	ID        int    `json:"id"`
	UserID    int    `json:"user_id"`
	Challenge string `json:"challenge"`
	Score     int    `json:"score"`
}
