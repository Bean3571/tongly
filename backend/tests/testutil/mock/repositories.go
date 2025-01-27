package mock

import (
	"database/sql"
	"tongly/backend/internal/entities"
)

type UserRepository struct {
	DB *sql.DB
}

func (r *UserRepository) CreateUser(user entities.User) error {
	query := `INSERT INTO users (username, password_hash, role, email, first_name, last_name, profile_picture) 
              VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.DB.Exec(query,
		user.Username,
		user.PasswordHash,
		user.Role,
		user.Email,
		user.FirstName,
		user.LastName,
		user.ProfilePicture)
	return err
}

func (r *UserRepository) GetUserByUsername(username string) (*entities.User, error) {
	query := `SELECT id, username, password_hash, role, email, first_name, last_name, profile_picture 
              FROM users WHERE username = $1`
	row := r.DB.QueryRow(query, username)

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
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) GetUserByID(id int) (*entities.User, error) {
	query := `SELECT id, username, password_hash, role, email, first_name, last_name, profile_picture 
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
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) UpdateUser(user entities.User) error {
	query := `UPDATE users 
              SET email = $1, profile_picture = $2, first_name = $3, last_name = $4, password_hash = $5 
              WHERE id = $6`
	_, err := r.DB.Exec(query,
		user.Email,
		user.ProfilePicture,
		user.FirstName,
		user.LastName,
		user.PasswordHash,
		user.ID)
	return err
}
