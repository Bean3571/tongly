package usecases

import (
	"errors"
	"tongly-basic/backend/internal/entities"
	"tongly-basic/backend/internal/logger"
	"tongly-basic/backend/internal/repositories"
)

type TutorUseCase struct {
	TutorRepo repositories.TutorRepository
	UserRepo  repositories.UserRepository
}

func NewTutorUseCase(tutorRepo repositories.TutorRepository, userRepo repositories.UserRepository) *TutorUseCase {
	return &TutorUseCase{
		TutorRepo: tutorRepo,
		UserRepo:  userRepo,
	}
}

func (uc *TutorUseCase) RegisterTutor(userID int, data entities.TutorRegistrationData) (*entities.Tutor, error) {
	logger.Info("Starting tutor registration process", "user_id", userID)

	// Check if user exists
	user, err := uc.UserRepo.GetUserByID(userID)
	if err != nil {
		logger.Error("Failed to get user", "error", err)
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Check if user is already a tutor
	existingTutor, err := uc.TutorRepo.GetTutorByUserID(userID)
	if err != nil {
		logger.Error("Failed to check existing tutor", "error", err)
		return nil, err
	}
	if existingTutor != nil {
		return nil, errors.New("user is already registered as a tutor")
	}

	// Create tutor profile
	tutor := &entities.Tutor{
		UserID:             userID,
		Bio:                data.Bio,
		Education:          data.Education,
		Certificates:       data.Certificates,
		TeachingExperience: data.TeachingExperience,
		HourlyRate:         data.HourlyRate,
		SchedulePreset:     data.SchedulePreset,
		MinLessonDuration:  data.MinLessonDuration,
		MaxStudents:        data.MaxStudents,
		TrialAvailable:     data.TrialAvailable,
		TrialPrice:         data.TrialPrice,
		Languages:          data.Languages,
		Availability:       data.Availability,
	}

	if err := uc.TutorRepo.CreateTutor(tutor); err != nil {
		logger.Error("Failed to create tutor", "error", err)
		return nil, err
	}

	logger.Info("Tutor registration successful", "user_id", userID)
	return tutor, nil
}

func (uc *TutorUseCase) GetTutorByID(id int) (*entities.Tutor, error) {
	return uc.TutorRepo.GetTutorByID(id)
}

func (uc *TutorUseCase) GetTutorByUserID(userID int) (*entities.Tutor, error) {
	return uc.TutorRepo.GetTutorByUserID(userID)
}

func (uc *TutorUseCase) ListTutors() ([]entities.Tutor, error) {
	return uc.TutorRepo.ListTutors()
}

func (uc *TutorUseCase) UpdateTutor(id int, data entities.TutorRegistrationData) (*entities.Tutor, error) {
	tutor, err := uc.TutorRepo.GetTutorByID(id)
	if err != nil {
		return nil, err
	}
	if tutor == nil {
		return nil, errors.New("tutor not found")
	}

	// Update fields
	tutor.Bio = data.Bio
	tutor.Education = data.Education
	tutor.Certificates = data.Certificates
	tutor.TeachingExperience = data.TeachingExperience
	tutor.HourlyRate = data.HourlyRate
	tutor.SchedulePreset = data.SchedulePreset
	tutor.MinLessonDuration = data.MinLessonDuration
	tutor.MaxStudents = data.MaxStudents
	tutor.TrialAvailable = data.TrialAvailable
	tutor.TrialPrice = data.TrialPrice
	tutor.Languages = data.Languages
	tutor.Availability = data.Availability

	if err := uc.TutorRepo.UpdateTutor(tutor); err != nil {
		return nil, err
	}

	return tutor, nil
}
