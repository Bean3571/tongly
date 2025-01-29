package repositories

import "tongly-backend/internal/entities"

type ChallengeRepository interface {
	SubmitChallenge(challenge entities.Challenge) error
	GetLeaderboard() ([]entities.Challenge, error)
}
