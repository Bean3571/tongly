package repositories

import (
	"database/sql"
	"encoding/json"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/logger"

	"github.com/lib/pq"
)

type UserRepositoryImpl struct {
	DB *sql.DB
}

func (r *UserRepositoryImpl) CreateUser(user entities.User) error {
	query := `INSERT INTO users (username, password_hash, role, email, profile_picture) 
              VALUES ($1, $2, $3, $4, $5)`
	_, err := r.DB.Exec(query, user.Username, user.PasswordHash, user.Role, user.Email, user.ProfilePicture)
	if err != nil {
		logger.Error("Failed to create user", "error", err, "username", user.Username)
		return err
	}

	logger.Info("User created successfully", "username", user.Username)
	return nil
}

func (r *UserRepositoryImpl) GetUserByUsername(username string) (*entities.User, error) {
	query := `SELECT id, username, password_hash, role, email, profile_picture 
              FROM users WHERE username = $1`
	row := r.DB.QueryRow(query, username)

	var user entities.User
	if err := row.Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Email, &user.ProfilePicture); err != nil {
		if err == sql.ErrNoRows {
			logger.Info("User not found", "username", username)
			return nil, nil
		}
		logger.Error("Failed to fetch user", "error", err, "username", username)
		return nil, err
	}

	logger.Info("User fetched successfully", "username", username)
	return &user, nil
}

func (r *UserRepositoryImpl) GetUserByID(id int) (*entities.User, error) {
	logger.Info("Getting user by ID", "id", id)

	var user entities.User
	var age sql.NullInt64
	var firstName, lastName, profilePicture, nativeLanguage sql.NullString
	var languagesJSON []byte

	query := `
		SELECT id, username, password_hash, role, email, first_name, last_name, profile_picture,
			   age, native_language, languages, interests, learning_goals, survey_complete
		FROM users
		WHERE id = $1`

	err := r.DB.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Role,
		&user.Email,
		&firstName,
		&lastName,
		&profilePicture,
		&age,
		&nativeLanguage,
		&languagesJSON,
		pq.Array(&user.Interests),
		pq.Array(&user.LearningGoals),
		&user.SurveyComplete,
	)

	if err == sql.ErrNoRows {
		logger.Error("User not found", "id", id)
		return nil, nil
	}

	if err != nil {
		logger.Error("Failed to get user by ID",
			"error", err,
			"id", id)
		return nil, err
	}

	// Convert nullable fields to pointers
	if age.Valid {
		ageInt := int(age.Int64)
		user.Age = &ageInt
	}
	if firstName.Valid {
		user.FirstName = &firstName.String
	}
	if lastName.Valid {
		user.LastName = &lastName.String
	}
	if profilePicture.Valid {
		user.ProfilePicture = &profilePicture.String
	}
	if nativeLanguage.Valid {
		user.NativeLanguage = &nativeLanguage.String
	}

	// Initialize arrays if nil
	if user.Languages == nil {
		user.Languages = make([]entities.LanguageLevel, 0)
	}
	if user.Interests == nil {
		user.Interests = make([]string, 0)
	}
	if user.LearningGoals == nil {
		user.LearningGoals = make([]string, 0)
	}

	// Decode languages JSON
	if len(languagesJSON) > 0 {
		err = json.Unmarshal(languagesJSON, &user.Languages)
		if err != nil {
			logger.Error("Failed to unmarshal languages JSON",
				"error", err,
				"json", string(languagesJSON),
				"id", id)
			return nil, err
		}
	}

	logger.Info("User retrieved successfully", "id", id)
	return &user, nil
}

func (r *UserRepositoryImpl) UpdateSurvey(userID int, nativeLanguage string, languages []entities.LanguageLevel, interests []string, learningGoals []string) error {
	logger.Info("Attempting to update user survey data",
		"user_id", userID,
		"native_language", nativeLanguage,
		"languages", languages,
		"interests", interests,
		"learning_goals", learningGoals)

	// Convert languages to JSON
	languagesJSON, err := json.Marshal(languages)
	if err != nil {
		logger.Error("Failed to marshal languages to JSON",
			"error", err,
			"user_id", userID)
		return err
	}

	// Use a transaction to ensure data consistency
	tx, err := r.DB.Begin()
	if err != nil {
		logger.Error("Failed to begin transaction", "error", err)
		return err
	}
	defer tx.Rollback()

	query := `
        UPDATE users 
        SET native_language = $1,
            languages = $2::jsonb,
            interests = $3::text[],
            learning_goals = $4::text[],
            survey_complete = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING id`

	var id int
	err = tx.QueryRow(
		query,
		nativeLanguage,
		languagesJSON,
		pq.Array(interests),
		pq.Array(learningGoals),
		userID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update user survey",
			"error", err,
			"error_type", err.Error(),
			"user_id", userID)
		return err
	}

	if err = tx.Commit(); err != nil {
		logger.Error("Failed to commit transaction", "error", err)
		return err
	}

	logger.Info("User survey updated successfully",
		"user_id", userID,
		"updated_id", id)
	return nil
}

func (r *UserRepositoryImpl) UpdateUser(user entities.User) error {
	logger.Info("Attempting to update user profile",
		"user_id", user.ID,
		"email", user.Email,
		"first_name", user.FirstName,
		"last_name", user.LastName)

	// Convert languages to JSON
	var languagesJSON []byte
	var err error
	if len(user.Languages) > 0 {
		languagesJSON, err = json.Marshal(user.Languages)
		if err != nil {
			logger.Error("Failed to marshal languages", "error", err)
			return err
		}
	}

	// Use a transaction to ensure data consistency
	tx, err := r.DB.Begin()
	if err != nil {
		logger.Error("Failed to begin transaction", "error", err)
		return err
	}
	defer tx.Rollback()

	query := `
        UPDATE users 
        SET email = COALESCE(NULLIF($1, ''), email),
            first_name = $2,
            last_name = $3,
            profile_picture = $4,
            age = $5,
            native_language = $6,
            languages = COALESCE($7::jsonb, languages),
            interests = COALESCE($8::text[], interests),
            learning_goals = COALESCE($9::text[], learning_goals),
            survey_complete = $10,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING id`

	var id int
	err = tx.QueryRow(
		query,
		user.Email,
		user.FirstName,
		user.LastName,
		user.ProfilePicture,
		user.Age,
		user.NativeLanguage,
		languagesJSON,
		pq.Array(user.Interests),
		pq.Array(user.LearningGoals),
		user.SurveyComplete,
		user.ID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update user",
			"error", err,
			"error_type", err.Error(),
			"user_id", user.ID)
		return err
	}

	if err = tx.Commit(); err != nil {
		logger.Error("Failed to commit transaction", "error", err)
		return err
	}

	logger.Info("User profile updated successfully",
		"user_id", user.ID,
		"updated_id", id)
	return nil
}
