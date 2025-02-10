package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"tongly-backend/pkg/jwt"

	"github.com/gin-gonic/gin"
)

type Claims struct {
	UserID int
	Role   string
}

func verifyToken(tokenString string) (*Claims, error) {
	userID, role, err := jwt.ValidateToken(tokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	return &Claims{
		UserID: userID,
		Role:   role,
	}, nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Check if it's a Bearer token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			return
		}

		token := parts[1]
		if token == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
			return
		}

		// Verify the token and get user claims
		claims, err := verifyToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)

		c.Next()
	}
}
