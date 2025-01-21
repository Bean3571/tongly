package usecases

import (
    "tongly/backend/internal/entities"
    "tongly/backend/internal/repositories"
)

type AuthUseCase struct {
    UserRepo repositories.UserRepository
}

func (uc *AuthUseCase) Register(user entities.User) error {
    // Hash password (use bcrypt)
    // Save user to database
    return uc.UserRepo.CreateUser(user)
}