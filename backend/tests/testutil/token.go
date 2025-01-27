package testutil

import (
	"time"

	"github.com/golang-jwt/jwt"
)

func GenerateValidToken() string {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["user_id"] = 1
	claims["exp"] = time.Now().Add(time.Hour * 24).Unix()

	tokenString, _ := token.SignedString([]byte("your-secret-key"))
	return tokenString
}
