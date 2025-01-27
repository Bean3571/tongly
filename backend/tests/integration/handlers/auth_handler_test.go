package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/interfaces"
	"tongly/backend/internal/usecases"
	"tongly/backend/tests/testutil"
	"tongly/backend/tests/testutil/mock"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAuthHandler_Register(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer db.Close()

	gin.SetMode(gin.TestMode)
	router := gin.New()

	userRepo := &mock.UserRepository{DB: db}
	authUseCase := usecases.AuthUseCase{UserRepo: userRepo}
	authHandler := interfaces.AuthHandler{AuthUseCase: authUseCase}

	router.POST("/auth/register", authHandler.Register)

	tests := []struct {
		name       string
		input      entities.User
		wantStatus int
	}{
		{
			name: "Valid registration",
			input: entities.User{
				Username: "testuser",
				Password: "password123",
				Email:    "test@example.com",
				Role:     "student",
			},
			wantStatus: http.StatusOK,
		},
		{
			name: "Invalid registration - missing fields",
			input: entities.User{
				Username: "testuser",
			},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonData, _ := json.Marshal(tt.input)
			req := httptest.NewRequest("POST", "/auth/register", bytes.NewBuffer(jsonData))
			req.Header.Set("Content-Type", "application/json")

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)
		})
	}
}
