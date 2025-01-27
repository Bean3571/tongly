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

func (r *UserRepositoryImpl) GetUserByID(id int) (*entities.User, error) {
	query := `
        SELECT id, username, password_hash, role, email, first_name, last_name, profile_picture 
        FROM users WHERE id = $1`
	row := r.DB.QueryRow(query, id)

	var user entities.User
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Role,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.ProfilePicture)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepositoryImpl) UpdateUser(user entities.User) error {
	logger.Info("Updating user profile",
		"user_id", user.ID,
		"email", user.Email,
		"first_name", user.FirstName,
		"last_name", user.LastName)

	query := `
        UPDATE users 
        SET email = $1, 
            first_name = $2,
            last_name = $3,
            profile_picture = $4
        WHERE id = $5
        RETURNING id`

	var id int
	err := r.DB.QueryRow(
		query,
		user.Email,
		user.FirstName,
		user.LastName,
		user.ProfilePicture,
		user.ID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update user",
			"error", err,
			"user_id", user.ID)
		return err
	}

	logger.Info("User profile updated successfully",
		"user_id", user.ID)
	return nil
}
