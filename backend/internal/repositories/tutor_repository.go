package repositories

import "tongly/backend/internal/entities"

type TutorRepository interface {
	CreateTutor(tutor entities.Tutor) error
	ListTutors() ([]entities.Tutor, error)
}
