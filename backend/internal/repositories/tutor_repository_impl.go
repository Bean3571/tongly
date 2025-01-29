package repositories

import (
	"database/sql"
	"tongly-backend/internal/entities"
)

type TutorRepositoryImpl struct {
	DB *sql.DB
}

func (r *TutorRepositoryImpl) CreateTutor(tutor entities.Tutor) error {
	query := `INSERT INTO tutors (user_id, expertise, bio, schedule, availability) 
              VALUES ($1, $2, $3, $4, $5)`
	_, err := r.DB.Exec(query, tutor.UserID, tutor.Expertise, tutor.Bio, tutor.Schedule, tutor.Availability)
	return err
}

func (r *TutorRepositoryImpl) ListTutors() ([]entities.Tutor, error) {
	query := `SELECT id, user_id, expertise, bio, schedule, availability FROM tutors`
	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tutors []entities.Tutor
	for rows.Next() {
		var tutor entities.Tutor
		if err := rows.Scan(&tutor.ID, &tutor.UserID, &tutor.Expertise, &tutor.Bio, &tutor.Schedule, &tutor.Availability); err != nil {
			return nil, err
		}
		tutors = append(tutors, tutor)
	}
	return tutors, nil
}
