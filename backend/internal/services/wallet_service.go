package services

import (
	"context"
	"errors"
	"fmt"
	"time"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

const (
	CommissionRate = 0.20 // 20% commission
)

type WalletService struct {
	walletRepo repositories.WalletRepository
	lessonRepo repositories.LessonRepository
}

func NewWalletService(walletRepo repositories.WalletRepository, lessonRepo repositories.LessonRepository) *WalletService {
	return &WalletService{
		walletRepo: walletRepo,
		lessonRepo: lessonRepo,
	}
}

type ProcessLessonPaymentResult struct {
	StudentBalance float64
	TutorBalance   float64
	Commission     float64
	NetAmount      float64
}

func (s *WalletService) ProcessLessonPayment(ctx context.Context, lessonID int, studentID int) (*ProcessLessonPaymentResult, error) {
	// Get lesson details
	lesson, err := s.lessonRepo.GetLesson(ctx, lessonID)
	if err != nil {
		return nil, fmt.Errorf("failed to get lesson: %v", err)
	}

	// Verify student
	if lesson.StudentID != studentID {
		return nil, errors.New("unauthorized: student does not match lesson")
	}

	// Calculate amounts
	commission := lesson.Price * CommissionRate
	netAmount := lesson.Price - commission
	totalDebit := lesson.Price + commission

	// Begin transaction
	result, err := s.walletRepo.ExecuteTransaction(ctx, func(tx repositories.WalletTx) error {
		// Lock and check student balance
		studentBalance, err := tx.GetLockedBalance(studentID)
		if err != nil {
			return err
		}
		if studentBalance < totalDebit {
			return errors.New("insufficient funds")
		}

		// Debit student account
		if err := tx.CreateTransaction(&entities.WalletTransaction{
			UserID:           studentID,
			Amount:           -totalDebit,
			CommissionAmount: commission,
			TransactionType:  "lesson_payment",
			Status:           "completed",
			Currency:         "RUB",
			ReferenceID:      fmt.Sprintf("lesson_%d", lessonID),
		}); err != nil {
			return err
		}

		// Credit tutor account
		if err := tx.CreateTransaction(&entities.WalletTransaction{
			UserID:           lesson.TutorID,
			Amount:           netAmount,
			CommissionAmount: 0,
			TransactionType:  "lesson_payment",
			Status:           "completed",
			Currency:         "RUB",
			ReferenceID:      fmt.Sprintf("lesson_%d", lessonID),
		}); err != nil {
			return err
		}

		// Record platform earnings
		if err := tx.CreatePlatformEarning(&entities.PlatformEarning{
			TransactionID:    0, // Will be set by the repository
			CommissionAmount: commission,
			Currency:         "RUB",
		}); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &ProcessLessonPaymentResult{
		StudentBalance: result.NewBalance,
		TutorBalance:   result.TutorBalance,
		Commission:     commission,
		NetAmount:      netAmount,
	}, nil
}

func (s *WalletService) GetBalance(ctx context.Context, userID int) (float64, error) {
	return s.walletRepo.GetBalance(ctx, userID)
}

func (s *WalletService) GetTransactionHistory(ctx context.Context, userID int, role string) ([]entities.WalletTransaction, error) {
	transactions, err := s.walletRepo.GetTransactionHistory(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Filter and format based on role
	for i := range transactions {
		if role == "student" {
			// Students see the full amount including commission
			transactions[i].DisplayAmount = transactions[i].Amount
		} else {
			// Tutors see the net amount after commission
			transactions[i].DisplayAmount = transactions[i].NetAmount
		}
	}

	return transactions, nil
}

func (s *WalletService) ProcessDeposit(ctx context.Context, userID int, amount float64) error {
	if amount <= 0 {
		return errors.New("deposit amount must be positive")
	}

	return s.walletRepo.CreateTransaction(ctx, &entities.WalletTransaction{
		UserID:           userID,
		Amount:           amount,
		CommissionAmount: 0,
		TransactionType:  "deposit",
		Status:           "completed",
		Currency:         "RUB",
		ReferenceID:      fmt.Sprintf("deposit_%d_%d", userID, time.Now().Unix()),
	})
}

func (s *WalletService) ProcessWithdrawal(ctx context.Context, userID int, amount float64) error {
	if amount <= 0 {
		return errors.New("withdrawal amount must be positive")
	}

	// Check balance
	balance, err := s.walletRepo.GetBalance(ctx, userID)
	if err != nil {
		return err
	}
	if balance < amount {
		return errors.New("insufficient funds")
	}

	return s.walletRepo.CreateTransaction(ctx, &entities.WalletTransaction{
		UserID:           userID,
		Amount:           -amount,
		CommissionAmount: 0,
		TransactionType:  "withdrawal",
		Status:           "pending", // Withdrawals start as pending
		Currency:         "RUB",
		ReferenceID:      fmt.Sprintf("withdrawal_%d_%d", userID, time.Now().Unix()),
	})
}
