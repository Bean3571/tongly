package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"
	"tongly-backend/internal/entities"
)

type WalletRepositoryImpl struct {
	db *sql.DB
}

func NewWalletRepository(db *sql.DB) WalletRepository {
	return &WalletRepositoryImpl{db: db}
}

// Transaction implementation
type walletTx struct {
	tx *sql.Tx
}

func (t *walletTx) GetLockedBalance(userID int) (float64, error) {
	var balance float64
	query := `
        SELECT COALESCE(SUM(
            CASE 
                WHEN transaction_type = 'deposit' THEN amount
                WHEN transaction_type = 'lesson_payment' THEN -(amount + commission_amount)
                ELSE -amount
            END
        ), 0)
        FROM wallet_transactions
        WHERE user_id = $1 AND status = 'completed'
        FOR UPDATE`

	err := t.tx.QueryRow(query, userID).Scan(&balance)
	if err != nil {
		return 0, fmt.Errorf("failed to get locked balance: %v", err)
	}
	return balance, nil
}

func (t *walletTx) CreateTransaction(tx *entities.WalletTransaction) error {
	query := `
        INSERT INTO wallet_transactions (
            user_id, amount, commission_amount, transaction_type, 
            status, currency, reference_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`

	return t.tx.QueryRow(
		query,
		tx.UserID,
		tx.Amount,
		tx.CommissionAmount,
		tx.TransactionType,
		tx.Status,
		tx.Currency,
		tx.ReferenceID,
		time.Now(),
	).Scan(&tx.ID)
}

func (t *walletTx) CreatePlatformEarning(earning *entities.PlatformEarning) error {
	query := `
        INSERT INTO platform_earnings (
            transaction_id, commission_amount, currency, processed_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id`

	return t.tx.QueryRow(
		query,
		earning.TransactionID,
		earning.CommissionAmount,
		earning.Currency,
		time.Now(),
	).Scan(&earning.ID)
}

// WalletRepositoryImpl methods
func (r *WalletRepositoryImpl) CreateTransaction(ctx context.Context, tx *entities.WalletTransaction) error {
	query := `
        INSERT INTO wallet_transactions (
            user_id, amount, commission_amount, transaction_type, 
            status, currency, reference_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`

	return r.db.QueryRowContext(
		ctx,
		query,
		tx.UserID,
		tx.Amount,
		tx.CommissionAmount,
		tx.TransactionType,
		tx.Status,
		tx.Currency,
		tx.ReferenceID,
		time.Now(),
	).Scan(&tx.ID)
}

func (r *WalletRepositoryImpl) GetTransactionHistory(ctx context.Context, userID int) ([]entities.WalletTransaction, error) {
	query := `
        SELECT id, user_id, amount, commission_amount, net_amount,
               transaction_type, status, currency, reference_id, created_at
        FROM wallet_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []entities.WalletTransaction
	for rows.Next() {
		var tx entities.WalletTransaction
		err := rows.Scan(
			&tx.ID, &tx.UserID, &tx.Amount, &tx.CommissionAmount, &tx.NetAmount,
			&tx.TransactionType, &tx.Status, &tx.Currency, &tx.ReferenceID, &tx.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, tx)
	}
	return transactions, nil
}

func (r *WalletRepositoryImpl) GetTransaction(ctx context.Context, id int) (*entities.WalletTransaction, error) {
	query := `
        SELECT id, user_id, amount, commission_amount, net_amount,
               transaction_type, status, currency, reference_id, created_at
        FROM wallet_transactions
        WHERE id = $1`

	tx := &entities.WalletTransaction{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&tx.ID, &tx.UserID, &tx.Amount, &tx.CommissionAmount, &tx.NetAmount,
		&tx.TransactionType, &tx.Status, &tx.Currency, &tx.ReferenceID, &tx.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, errors.New("transaction not found")
	}
	if err != nil {
		return nil, err
	}
	return tx, nil
}

func (r *WalletRepositoryImpl) GetBalance(ctx context.Context, userID int) (float64, error) {
	query := `
        SELECT COALESCE(SUM(
            CASE 
                WHEN transaction_type = 'deposit' THEN amount
                WHEN transaction_type = 'lesson_payment' THEN -(amount + commission_amount)
                ELSE -amount
            END
        ), 0)
        FROM wallet_transactions
        WHERE user_id = $1 AND status = 'completed'`

	var balance float64
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&balance)
	if err != nil {
		return 0, err
	}
	return balance, nil
}

func (r *WalletRepositoryImpl) CreatePlatformEarning(ctx context.Context, earning *entities.PlatformEarning) error {
	query := `
        INSERT INTO platform_earnings (
            transaction_id, commission_amount, currency, processed_at
        ) VALUES ($1, $2, $3, $4)
        RETURNING id`

	return r.db.QueryRowContext(
		ctx,
		query,
		earning.TransactionID,
		earning.CommissionAmount,
		earning.Currency,
		time.Now(),
	).Scan(&earning.ID)
}

func (r *WalletRepositoryImpl) GetPlatformEarnings(ctx context.Context, startDate, endDate string) ([]entities.PlatformEarning, error) {
	query := `
        SELECT id, transaction_id, commission_amount, currency, processed_at
        FROM platform_earnings
        WHERE processed_at BETWEEN $1 AND $2
        ORDER BY processed_at DESC`

	rows, err := r.db.QueryContext(ctx, query, startDate, endDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var earnings []entities.PlatformEarning
	for rows.Next() {
		var earning entities.PlatformEarning
		err := rows.Scan(
			&earning.ID, &earning.TransactionID, &earning.CommissionAmount,
			&earning.Currency, &earning.ProcessedAt,
		)
		if err != nil {
			return nil, err
		}
		earnings = append(earnings, earning)
	}
	return earnings, nil
}

func (r *WalletRepositoryImpl) ExecuteTransaction(ctx context.Context, fn func(WalletTx) error) (*TransactionResult, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}

	wtx := &walletTx{tx: tx}
	if err := fn(wtx); err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	return &TransactionResult{}, nil
}
