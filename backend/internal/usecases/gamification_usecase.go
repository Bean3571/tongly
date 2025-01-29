package usecases

import (
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

type GamificationUseCase struct {
	ChallengeRepo repositories.ChallengeRepository
}

func (uc *GamificationUseCase) SubmitChallenge(challenge entities.Challenge) error {
	return uc.ChallengeRepo.SubmitChallenge(challenge)
}

func (uc *GamificationUseCase) GetLeaderboard() ([]entities.Challenge, error) {
	return uc.ChallengeRepo.GetLeaderboard()
}
