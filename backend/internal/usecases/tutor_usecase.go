package usecases

import (
	"tongly/backend/internal/entities"
	"tongly/backend/internal/repositories"
)

type TutorUseCase struct {
	TutorRepo repositories.TutorRepository
}

func (uc *TutorUseCase) RegisterTutor(tutor entities.Tutor) error {
	return uc.TutorRepo.CreateTutor(tutor)
}

func (uc *TutorUseCase) ListTutors() ([]entities.Tutor, error) {
	return uc.TutorRepo.ListTutors()
}
