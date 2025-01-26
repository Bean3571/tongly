package repositories

import (
	"database/sql"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/logger"
)

type UserRepositoryImpl struct {
	DB *sql.DB
}

func (r *UserRepositoryImpl) CreateUser(user entities.User) error {
	query := `INSERT INTO users (username, password_hash, role, email, profile_picture) 
              VALUES ($1, $2, $3, $4, $5)`
	_, err := r.DB.Exec(query, user.Username, user.PasswordHash, user.Role, user.Email, user.ProfilePicture)
	if err != nil {
		logger.Error("Failed to create user", "error", err, "username", user.Username)
		return err
	}

	logger.Info("User created successfully", "username", user.Username)
	return nil
}

func (r *UserRepositoryImpl) GetUserByUsername(username string) (*entities.User, error) {
	query := `SELECT id, username, password_hash, role, email, profile_picture 
              FROM users WHERE username = $1`
	row := r.DB.QueryRow(query, username)

	var user entities.User
	if err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Email, &user.ProfilePicture); err != nil {
		if err == sql.ErrNoRows {
			logger.Info("User not found", "username", username)
			return nil, nil
		}
		logger.Error("Failed to fetch user", "error", err, "username", username)
		return nil, err
	}

	logger.Info("User fetched successfully", "username", username)
	return &user, nil
}
