package repositories

import "tongly-basic/backend/internal/entities"

type TutorRepository interface {
	CreateTutor(tutor *entities.Tutor) error
	GetTutorByID(id int) (*entities.Tutor, error)
	GetTutorByUserID(userID int) (*entities.Tutor, error)
	UpdateTutor(tutor *entities.Tutor) error
	ListTutors() ([]entities.Tutor, error)
	DeleteTutor(id int) error
}
