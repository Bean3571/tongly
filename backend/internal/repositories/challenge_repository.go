package repositories

import "tongly-basic/backend/internal/entities"

type ChallengeRepository interface {
	SubmitChallenge(challenge entities.Challenge) error
	GetLeaderboard() ([]entities.Challenge, error)
}
