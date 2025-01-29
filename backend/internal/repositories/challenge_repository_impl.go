package repositories

import (
	"database/sql"
	"tongly-backend/internal/entities"
)

type ChallengeRepositoryImpl struct {
	DB *sql.DB
}

func (r *ChallengeRepositoryImpl) SubmitChallenge(challenge entities.Challenge) error {
	query := `INSERT INTO challenges (user_id, challenge, score) 
              VALUES ($1, $2, $3)`
	_, err := r.DB.Exec(query, challenge.UserID, challenge.Challenge, challenge.Score)
	return err
}

func (r *ChallengeRepositoryImpl) GetLeaderboard() ([]entities.Challenge, error) {
	query := `SELECT user_id, challenge, score FROM challenges ORDER BY score DESC`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var challenges []entities.Challenge
	for rows.Next() {
		var challenge entities.Challenge
		if err := rows.Scan(&challenge.UserID, &challenge.Challenge, &challenge.Score); err != nil {
			return nil, err
		}
		challenges = append(challenges, challenge)
	}
	return challenges, nil
}
