package repositories

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	"tongly-backend/internal/entities"

	"github.com/lib/pq"
)

// userRepositoryImpl implements UserRepository interface
type userRepositoryImpl struct {
	db *sql.DB
}

// NewUserRepository creates a new UserRepository instance
func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepositoryImpl{
		db: db,
	}
}

// CreateUser creates a new user in the users table
func (r *userRepositoryImpl) CreateUser(ctx context.Context, user *entities.User) error {
	query := `
		INSERT INTO users (
			username, password, email, first_name, last_name, 
			profile_picture_url, sex, age, role, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, created_at, updated_at`

	now := time.Now()
	err := r.db.QueryRowContext(
		ctx,
		query,
		user.Username,
		user.PasswordHash,
		user.Email,
		user.FirstName,
		user.LastName,
		user.ProfilePictureURL,
		user.Sex,
		user.Age,
		user.Role,
		now,
		now,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		// Check for unique constraint violation
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				if strings.Contains(pqErr.Message, "username") {
					return errors.New("username already exists")
				} else if strings.Contains(pqErr.Message, "email") {
					return errors.New("email already exists")
				}
			}
		}
		return fmt.Errorf("error creating user: %v", err)
	}

	return nil
}

// GetUserByUsername retrieves a user by username
func (r *userRepositoryImpl) GetUserByUsername(ctx context.Context, username string) (*entities.User, error) {
	query := `
		SELECT 
			id, username, password, email, first_name, last_name, 
			profile_picture_url, sex, age, role, created_at, updated_at
		FROM users 
		WHERE username = $1`

	var user entities.User
	var profilePicURL, sex sql.NullString
	var age sql.NullInt32

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&profilePicURL,
		&sex,
		&age,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("error retrieving user: %v", err)
	}

	// Handle nullable fields
	if profilePicURL.Valid {
		user.ProfilePictureURL = &profilePicURL.String
	}

	if sex.Valid {
		user.Sex = &sex.String
	}

	if age.Valid {
		ageVal := int(age.Int32)
		user.Age = &ageVal
	}

	return &user, nil
}

// GetUserByID retrieves a user by ID
func (r *userRepositoryImpl) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	query := `
		SELECT 
			id, username, password, email, first_name, last_name, 
			profile_picture_url, sex, age, role, created_at, updated_at
		FROM users 
		WHERE id = $1`

	var user entities.User
	var profilePicURL, sex sql.NullString
	var age sql.NullInt32

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&profilePicURL,
		&sex,
		&age,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("error retrieving user: %v", err)
	}

	// Handle nullable fields
	if profilePicURL.Valid {
		user.ProfilePictureURL = &profilePicURL.String
	}

	if sex.Valid {
		user.Sex = &sex.String
	}

	if age.Valid {
		ageVal := int(age.Int32)
		user.Age = &ageVal
	}

	return &user, nil
}

// UpdateUser updates a user's information
func (r *userRepositoryImpl) UpdateUser(ctx context.Context, user *entities.User) error {
	query := `
		UPDATE users
		SET 
			email = $1,
			first_name = $2,
			last_name = $3,
			profile_picture_url = $4,
			sex = $5,
			age = $6,
			password = $7,
			updated_at = $8
		WHERE id = $9
		RETURNING updated_at`

	now := time.Now()
	err := r.db.QueryRowContext(
		ctx,
		query,
		user.Email,
		user.FirstName,
		user.LastName,
		user.ProfilePictureURL,
		user.Sex,
		user.Age,
		user.PasswordHash,
		now,
		user.ID,
	).Scan(&user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return errors.New("user not found")
		}
		// Check for unique constraint violation
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" && strings.Contains(pqErr.Message, "email") {
				return errors.New("email already exists")
			}
		}
		return fmt.Errorf("error updating user: %v", err)
	}

	return nil
}

// AddUserLanguage adds a language proficiency for a user
func (r *userRepositoryImpl) AddUserLanguage(ctx context.Context, userLanguage *entities.UserLanguage) error {
	query := `
		INSERT INTO user_languages (user_id, language_id, proficiency_id, created_at)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, language_id) 
		DO UPDATE SET proficiency_id = $3, created_at = $4
		RETURNING created_at`

	now := time.Now()
	err := r.db.QueryRowContext(
		ctx,
		query,
		userLanguage.UserID,
		userLanguage.LanguageID,
		userLanguage.ProficiencyID,
		now,
	).Scan(&userLanguage.CreatedAt)

	if err != nil {
		return fmt.Errorf("error adding user language: %v", err)
	}

	return nil
}

// GetUserLanguages retrieves all languages for a user
func (r *userRepositoryImpl) GetUserLanguages(ctx context.Context, userID int) ([]entities.UserLanguage, error) {
	query := `
		SELECT ul.user_id, ul.language_id, ul.proficiency_id, ul.created_at,
			   l.name as language_name, p.name as proficiency_name
		FROM user_languages ul
		JOIN languages l ON ul.language_id = l.id
		JOIN language_proficiency p ON ul.proficiency_id = p.id
		WHERE ul.user_id = $1
		ORDER BY ul.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user languages: %v", err)
	}
	defer rows.Close()

	var userLanguages []entities.UserLanguage
	for rows.Next() {
		var ul entities.UserLanguage
		var language entities.Language
		var proficiency entities.Proficiency

		err := rows.Scan(
			&ul.UserID,
			&ul.LanguageID,
			&ul.ProficiencyID,
			&ul.CreatedAt,
			&language.Name,
			&proficiency.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning user language row: %v", err)
		}

		language.ID = ul.LanguageID
		proficiency.ID = ul.ProficiencyID
		ul.Language = &language
		ul.Proficiency = &proficiency

		userLanguages = append(userLanguages, ul)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user language rows: %v", err)
	}

	return userLanguages, nil
}

// UpdateUserLanguage updates a user's language proficiency
func (r *userRepositoryImpl) UpdateUserLanguage(ctx context.Context, userLanguage *entities.UserLanguage) error {
	query := `
		UPDATE user_languages
		SET proficiency_id = $1
		WHERE user_id = $2 AND language_id = $3`

	result, err := r.db.ExecContext(
		ctx,
		query,
		userLanguage.ProficiencyID,
		userLanguage.UserID,
		userLanguage.LanguageID,
	)

	if err != nil {
		return fmt.Errorf("error updating user language: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}
	if rows == 0 {
		return errors.New("language not found for user")
	}

	return nil
}

// RemoveUserLanguage removes a language for a user
func (r *userRepositoryImpl) RemoveUserLanguage(ctx context.Context, userID int, languageID int) error {
	query := `DELETE FROM user_languages WHERE user_id = $1 AND language_id = $2`

	result, err := r.db.ExecContext(ctx, query, userID, languageID)
	if err != nil {
		return fmt.Errorf("error removing user language: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}
	if rows == 0 {
		return errors.New("language not found for user")
	}

	return nil
}

// AddUserInterest adds an interest for a user
func (r *userRepositoryImpl) AddUserInterest(ctx context.Context, userID int, interestID int) error {
	query := `
		INSERT INTO user_interests (user_id, interest_id, created_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, interest_id) DO NOTHING`

	now := time.Now()
	_, err := r.db.ExecContext(
		ctx,
		query,
		userID,
		interestID,
		now,
	)

	if err != nil {
		return fmt.Errorf("error adding user interest: %v", err)
	}

	return nil
}

// GetUserInterests retrieves all interests for a user
func (r *userRepositoryImpl) GetUserInterests(ctx context.Context, userID int) ([]entities.UserInterest, error) {
	query := `
		SELECT ui.user_id, ui.interest_id, ui.created_at, i.name
		FROM user_interests ui
		JOIN interests i ON ui.interest_id = i.id
		WHERE ui.user_id = $1
		ORDER BY ui.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user interests: %v", err)
	}
	defer rows.Close()

	var userInterests []entities.UserInterest
	for rows.Next() {
		var ui entities.UserInterest
		var interest entities.Interest

		err := rows.Scan(
			&ui.UserID,
			&ui.InterestID,
			&ui.CreatedAt,
			&interest.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning user interest row: %v", err)
		}

		interest.ID = ui.InterestID
		ui.Interest = &interest

		userInterests = append(userInterests, ui)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user interest rows: %v", err)
	}

	return userInterests, nil
}

// RemoveUserInterest removes an interest for a user
func (r *userRepositoryImpl) RemoveUserInterest(ctx context.Context, userID int, interestID int) error {
	query := `DELETE FROM user_interests WHERE user_id = $1 AND interest_id = $2`

	result, err := r.db.ExecContext(ctx, query, userID, interestID)
	if err != nil {
		return fmt.Errorf("error removing user interest: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}
	if rows == 0 {
		return errors.New("interest not found for user")
	}

	return nil
}

// AddUserGoal adds a goal for a user
func (r *userRepositoryImpl) AddUserGoal(ctx context.Context, userID int, goalID int) error {
	query := `
		INSERT INTO user_goals (user_id, goal_id, created_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id, goal_id) DO NOTHING`

	now := time.Now()
	_, err := r.db.ExecContext(
		ctx,
		query,
		userID,
		goalID,
		now,
	)

	if err != nil {
		return fmt.Errorf("error adding user goal: %v", err)
	}

	return nil
}

// GetUserGoals retrieves all goals for a user
func (r *userRepositoryImpl) GetUserGoals(ctx context.Context, userID int) ([]entities.UserGoal, error) {
	query := `
		SELECT ug.user_id, ug.goal_id, ug.created_at, g.name
		FROM user_goals ug
		JOIN goals g ON ug.goal_id = g.id
		WHERE ug.user_id = $1
		ORDER BY ug.created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error retrieving user goals: %v", err)
	}
	defer rows.Close()

	var userGoals []entities.UserGoal
	for rows.Next() {
		var ug entities.UserGoal
		var goal entities.Goal

		err := rows.Scan(
			&ug.UserID,
			&ug.GoalID,
			&ug.CreatedAt,
			&goal.Name,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning user goal row: %v", err)
		}

		goal.ID = ug.GoalID
		ug.Goal = &goal

		userGoals = append(userGoals, ug)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating user goal rows: %v", err)
	}

	return userGoals, nil
}

// RemoveUserGoal removes a goal for a user
func (r *userRepositoryImpl) RemoveUserGoal(ctx context.Context, userID int, goalID int) error {
	query := `DELETE FROM user_goals WHERE user_id = $1 AND goal_id = $2`

	result, err := r.db.ExecContext(ctx, query, userID, goalID)
	if err != nil {
		return fmt.Errorf("error removing user goal: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("error getting rows affected: %v", err)
	}
	if rows == 0 {
		return errors.New("goal not found for user")
	}

	return nil
}

// GetAllLanguages retrieves all available languages
func (r *userRepositoryImpl) GetAllLanguages(ctx context.Context) ([]entities.Language, error) {
	query := `SELECT id, name, created_at FROM languages ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error retrieving languages: %v", err)
	}
	defer rows.Close()

	var languages []entities.Language
	for rows.Next() {
		var language entities.Language

		err := rows.Scan(
			&language.ID,
			&language.Name,
			&language.CreatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning language row: %v", err)
		}

		languages = append(languages, language)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating language rows: %v", err)
	}

	return languages, nil
}

// GetAllInterests retrieves all available interests
func (r *userRepositoryImpl) GetAllInterests(ctx context.Context) ([]entities.Interest, error) {
	query := `SELECT id, name, created_at FROM interests ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error retrieving interests: %v", err)
	}
	defer rows.Close()

	var interests []entities.Interest
	for rows.Next() {
		var interest entities.Interest

		err := rows.Scan(
			&interest.ID,
			&interest.Name,
			&interest.CreatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning interest row: %v", err)
		}

		interests = append(interests, interest)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating interest rows: %v", err)
	}

	return interests, nil
}

// GetAllGoals retrieves all available goals
func (r *userRepositoryImpl) GetAllGoals(ctx context.Context) ([]entities.Goal, error) {
	query := `SELECT id, name, created_at FROM goals ORDER BY name`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error retrieving goals: %v", err)
	}
	defer rows.Close()

	var goals []entities.Goal
	for rows.Next() {
		var goal entities.Goal

		err := rows.Scan(
			&goal.ID,
			&goal.Name,
			&goal.CreatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning goal row: %v", err)
		}

		goals = append(goals, goal)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating goal rows: %v", err)
	}

	return goals, nil
}

// GetAllProficiencies retrieves all available language proficiency levels
func (r *userRepositoryImpl) GetAllProficiencies(ctx context.Context) ([]entities.Proficiency, error) {
	query := `SELECT id, name, created_at FROM language_proficiency ORDER BY id`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("error retrieving proficiencies: %v", err)
	}
	defer rows.Close()

	var proficiencies []entities.Proficiency
	for rows.Next() {
		var proficiency entities.Proficiency

		err := rows.Scan(
			&proficiency.ID,
			&proficiency.Name,
			&proficiency.CreatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("error scanning proficiency row: %v", err)
		}

		proficiencies = append(proficiencies, proficiency)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating proficiency rows: %v", err)
	}

	return proficiencies, nil
}
