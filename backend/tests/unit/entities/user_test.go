package entities_test

import (
	"testing"
	"tongly/backend/internal/entities"
)

func TestUser_HashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "Valid password",
			password: "password123",
			wantErr:  false,
		},
		{
			name:     "Empty password",
			password: "",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			u := &entities.User{}
			err := u.HashPassword(tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("HashPassword() error = %v, wantErr %v", err, tt.wantErr)
			}
			if !tt.wantErr && u.PasswordHash == "" {
				t.Error("HashPassword() did not set password hash")
			}
		})
	}
}

func TestUser_ValidatePassword(t *testing.T) {
	u := &entities.User{}
	password := "password123"

	// First hash the password
	err := u.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}

	tests := []struct {
		name     string
		password string
		want     bool
	}{
		{
			name:     "Correct password",
			password: password,
			want:     true,
		},
		{
			name:     "Incorrect password",
			password: "wrongpassword",
			want:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := u.ValidatePassword(tt.password); got != tt.want {
				t.Errorf("ValidatePassword() = %v, want %v", got, tt.want)
			}
		})
	}
}
