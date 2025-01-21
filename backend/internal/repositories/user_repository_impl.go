package repositories

import (
	"database/sql"
	"tongly/backend/internal/entities"
)

type UserRepositoryImpl struct {
	DB *sql.DB
}

// Use a pointer receiver
func (r *UserRepositoryImpl) CreateUser(user entities.User) error {
	query := `INSERT INTO users (username, password_hash, role, email, profile_picture) 
              VALUES ($1, $2, $3, $4, $5)`
	_, err := r.DB.Exec(query, user.Username, user.PasswordHash, user.Role, user.Email, user.ProfilePicture)
	return err
}

// Use a pointer receiver
func (r *UserRepositoryImpl) GetUserByUsername(username string) (*entities.User, error) {
	query := `SELECT id, username, password_hash, role, email, profile_picture 
              FROM users WHERE username = $1`
	row := r.DB.QueryRow(query, username)

	var user entities.User
	if err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Email, &user.ProfilePicture); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}
	return &user, nil
}
