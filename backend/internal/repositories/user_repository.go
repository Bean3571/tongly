package repositories

import "tongly-backend/internal/entities"

type UserRepository interface {
	// User operations
	CreateUser(user entities.User) error
	GetUserByUsername(username string) (*entities.User, error)
	GetUserByID(id int) (*entities.User, error)
	UpdateUser(user entities.User) error

	// Profile operations
	CreateProfile(profile entities.UserProfile) error
	GetProfileByUserID(userID int) (*entities.UserProfile, error)
	UpdateProfile(profile entities.UserProfile) error
	UpdateSurvey(userID int, nativeLanguage string, languages []entities.LanguageLevel, interests []string, learningGoals []string) error
}
