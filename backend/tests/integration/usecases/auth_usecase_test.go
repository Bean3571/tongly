package usecases_test

import (
	"testing"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/usecases"
	"tongly/backend/tests/testutil"
	"tongly/backend/tests/testutil/mock"
)

func TestAuthUseCase_Register(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer db.Close()

	repo := &mock.UserRepository{DB: db}
	useCase := usecases.AuthUseCase{UserRepo: repo}

	tests := []struct {
		name    string
		user    entities.User
		wantErr bool
	}{
		{
			name: "Valid registration",
			user: entities.User{
				Username: "testuser",
				Password: "password123",
				Email:    "test@example.com",
				Role:     "student",
			},
			wantErr: false,
		},
		{
			name: "Duplicate username",
			user: entities.User{
				Username: "testuser",
				Password: "password123",
				Email:    "another@example.com",
				Role:     "student",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := useCase.Register(tt.user)
			if (err != nil) != tt.wantErr {
				t.Errorf("Register() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
