package repositories

import (
    "database/sql"
    "tongly/backend/internal/entities"
)

type UserRepository struct {
    DB *sql.DB
}

func (r *UserRepository) CreateUser(user entities.User) error {
    query := `INSERT INTO users (username, password_hash, role, email, profile_picture) 
              VALUES ($1, $2, $3, $4, $5)`
    _, err := r.DB.Exec(query, user.Username, user.PasswordHash, user.Role, user.Email, user.ProfilePicture)
    return err
}