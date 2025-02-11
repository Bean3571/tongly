package entities

import "time"

type WalletTransaction struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	Amount           float64   `json:"amount"`
	CommissionAmount float64   `json:"commission_amount"`
	NetAmount        float64   `json:"net_amount"`
	TransactionType  string    `json:"transaction_type"`
	Status           string    `json:"status"`
	Currency         string    `json:"currency"`
	ReferenceID      string    `json:"reference_id"`
	CreatedAt        time.Time `json:"created_at"`
	DisplayAmount    float64   `json:"display_amount,omitempty"` // For UI display
}

type PlatformEarning struct {
	ID               int       `json:"id"`
	TransactionID    int       `json:"transaction_id"`
	CommissionAmount float64   `json:"commission_amount"`
	Currency         string    `json:"currency"`
	ProcessedAt      time.Time `json:"processed_at"`
}

// Transaction types
const (
	TransactionTypeDeposit       = "deposit"
	TransactionTypeWithdrawal    = "withdrawal"
	TransactionTypeLessonPayment = "lesson_payment"
)

// Transaction statuses
const (
	TransactionStatusPending   = "pending"
	TransactionStatusCompleted = "completed"
	TransactionStatusFailed    = "failed"
)

// Currencies
const (
	CurrencyRUB = "RUB"
)
