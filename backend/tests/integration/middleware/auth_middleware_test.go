package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"tongly/backend/pkg/middleware"
	"tongly/backend/tests/testutil"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	router.GET("/protected", middleware.AuthMiddleware(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	tests := []struct {
		name       string
		token      string
		wantStatus int
	}{
		{
			name:       "Valid token",
			token:      "Bearer " + testutil.GenerateValidToken(),
			wantStatus: http.StatusOK,
		},
		{
			name:       "No token",
			token:      "",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "Invalid token",
			token:      "Bearer invalid-token",
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/protected", nil)
			if tt.token != "" {
				req.Header.Set("Authorization", tt.token)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.wantStatus, w.Code)
		})
	}
}
