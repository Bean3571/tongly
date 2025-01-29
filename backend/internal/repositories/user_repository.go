package repositories

import "tongly-basic/backend/internal/entities"

type UserRepository interface {
	CreateUser(user entities.User) error
	GetUserByUsername(username string) (*entities.User, error)
	GetUserByID(id int) (*entities.User, error)
	UpdateUser(user entities.User) error
	UpdateSurvey(userID int, nativeLanguage string, languages []entities.LanguageLevel, interests []string, learningGoals []string) error
}
