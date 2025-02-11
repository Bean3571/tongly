package repositories

import (
	"context"
	"tongly-backend/internal/entities"
)

// WalletTx represents a wallet transaction context
type WalletTx interface {
	GetLockedBalance(userID int) (float64, error)
	CreateTransaction(tx *entities.WalletTransaction) error
	CreatePlatformEarning(earning *entities.PlatformEarning) error
}

// TransactionResult represents the result of a wallet transaction
type TransactionResult struct {
	NewBalance   float64
	TutorBalance float64
}

// WalletRepository defines the interface for wallet-related database operations
type WalletRepository interface {
	// Transaction operations
	CreateTransaction(ctx context.Context, tx *entities.WalletTransaction) error
	GetTransactionHistory(ctx context.Context, userID int) ([]entities.WalletTransaction, error)
	GetTransaction(ctx context.Context, id int) (*entities.WalletTransaction, error)

	// Balance operations
	GetBalance(ctx context.Context, userID int) (float64, error)

	// Platform earnings
	CreatePlatformEarning(ctx context.Context, earning *entities.PlatformEarning) error
	GetPlatformEarnings(ctx context.Context, startDate, endDate string) ([]entities.PlatformEarning, error)

	// Transaction execution
	ExecuteTransaction(ctx context.Context, fn func(WalletTx) error) (*TransactionResult, error)
}
