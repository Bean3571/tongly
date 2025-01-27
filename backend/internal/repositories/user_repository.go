package repositories

import "tongly/backend/internal/entities"

type UserRepository interface {
	CreateUser(user entities.User) error
	GetUserByUsername(username string) (*entities.User, error)
	GetUserByID(id int) (*entities.User, error)
	UpdateUser(user entities.User) error
}
