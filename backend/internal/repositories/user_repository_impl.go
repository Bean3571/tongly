package repositories

import (
	"database/sql"
	"encoding/json"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

	"github.com/lib/pq"
)

type UserRepositoryImpl struct {
	DB *sql.DB
}

func (r *UserRepositoryImpl) CreateUser(user entities.User) error {
	query := `INSERT INTO users (username, password_hash, role, email) 
              VALUES ($1, $2, $3, $4) RETURNING id`

	err := r.DB.QueryRow(query, user.Username, user.PasswordHash, user.Role, user.Email).Scan(&user.ID)
	if err != nil {
		logger.Error("Failed to create user", "error", err, "username", user.Username)
		return err
	}

	logger.Info("User created successfully", "username", user.Username, "id", user.ID)
	return nil
}

func (r *UserRepositoryImpl) GetUserByUsername(username string) (*entities.User, error) {
	query := `SELECT u.id, u.username, u.password_hash, u.role, u.email 
              FROM users u WHERE u.username = $1`

	var user entities.User
	err := r.DB.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Role,
		&user.Email,
	)

	if err == sql.ErrNoRows {
		logger.Info("User not found", "username", username)
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to fetch user", "error", err, "username", username)
		return nil, err
	}

	// Get user profile
	profile, err := r.GetProfileByUserID(user.ID)
	if err != nil {
		logger.Error("Failed to fetch user profile", "error", err, "user_id", user.ID)
		return nil, err
	}
	user.Profile = profile

	logger.Info("User fetched successfully", "username", username)
	return &user, nil
}

func (r *UserRepositoryImpl) GetUserByID(id int) (*entities.User, error) {
	logger.Info("Getting user by ID", "id", id)

	query := `SELECT id, username, password_hash, role, email FROM users WHERE id = $1`

	var user entities.User
	err := r.DB.QueryRow(query, id).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Role,
		&user.Email,
	)

	if err == sql.ErrNoRows {
		logger.Error("User not found", "id", id)
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get user by ID", "error", err, "id", id)
		return nil, err
	}

	// Get user profile
	profile, err := r.GetProfileByUserID(id)
	if err != nil {
		logger.Error("Failed to fetch user profile", "error", err, "user_id", id)
		return nil, err
	}
	user.Profile = profile

	logger.Info("User retrieved successfully", "id", id)
	return &user, nil
}

func (r *UserRepositoryImpl) UpdateUser(user entities.User) error {
	query := `UPDATE users 
             SET email = COALESCE(NULLIF($1, ''), email),
                 role = COALESCE(NULLIF($2, ''), role),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id`

	var id int
	err := r.DB.QueryRow(query, user.Email, user.Role, user.ID).Scan(&id)
	if err != nil {
		logger.Error("Failed to update user", "error", err, "user_id", user.ID)
		return err
	}

	logger.Info("User updated successfully", "user_id", user.ID)
	return nil
}

func (r *UserRepositoryImpl) CreateProfile(profile entities.UserProfile) error {
	query := `INSERT INTO user_profiles (
                user_id, first_name, last_name, profile_picture, age, sex,
                native_language, languages, interests, learning_goals, survey_complete
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id`

	languagesJSON, err := json.Marshal(profile.Languages)
	if err != nil {
		logger.Error("Failed to marshal languages", "error", err)
		return err
	}

	err = r.DB.QueryRow(
		query,
		profile.UserID,
		profile.FirstName,
		profile.LastName,
		profile.ProfilePicture,
		profile.Age,
		profile.Sex,
		profile.NativeLanguage,
		languagesJSON,
		pq.Array(profile.Interests),
		pq.Array(profile.LearningGoals),
		profile.SurveyComplete,
	).Scan(&profile.ID)

	if err != nil {
		logger.Error("Failed to create profile", "error", err, "user_id", profile.UserID)
		return err
	}

	logger.Info("Profile created successfully", "user_id", profile.UserID)
	return nil
}

func (r *UserRepositoryImpl) GetProfileByUserID(userID int) (*entities.UserProfile, error) {
	query := `SELECT id, user_id, first_name, last_name, profile_picture,
                    age, sex, native_language, languages, interests,
                    learning_goals, survey_complete
             FROM user_profiles
             WHERE user_id = $1`

	var profile entities.UserProfile
	var firstName, lastName, profilePicture, nativeLanguage, sex sql.NullString
	var age sql.NullInt64
	var languagesJSON []byte

	err := r.DB.QueryRow(query, userID).Scan(
		&profile.ID,
		&profile.UserID,
		&firstName,
		&lastName,
		&profilePicture,
		&age,
		&sex,
		&nativeLanguage,
		&languagesJSON,
		pq.Array(&profile.Interests),
		pq.Array(&profile.LearningGoals),
		&profile.SurveyComplete,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get profile", "error", err, "user_id", userID)
		return nil, err
	}

	// Convert nullable fields
	if firstName.Valid {
		profile.FirstName = &firstName.String
	}
	if lastName.Valid {
		profile.LastName = &lastName.String
	}
	if profilePicture.Valid {
		profile.ProfilePicture = &profilePicture.String
	}
	if age.Valid {
		ageInt := int(age.Int64)
		profile.Age = &ageInt
	}
	if sex.Valid {
		profile.Sex = &sex.String
	}
	if nativeLanguage.Valid {
		profile.NativeLanguage = &nativeLanguage.String
	}

	// Initialize arrays if nil
	if profile.Languages == nil {
		profile.Languages = make([]entities.LanguageLevel, 0)
	}
	if profile.Interests == nil {
		profile.Interests = make([]string, 0)
	}
	if profile.LearningGoals == nil {
		profile.LearningGoals = make([]string, 0)
	}

	// Decode languages JSON
	if len(languagesJSON) > 0 {
		err = json.Unmarshal(languagesJSON, &profile.Languages)
		if err != nil {
			logger.Error("Failed to unmarshal languages JSON",
				"error", err,
				"json", string(languagesJSON),
				"user_id", userID)
			return nil, err
		}
	}

	logger.Info("Profile retrieved successfully", "user_id", userID)
	return &profile, nil
}

func (r *UserRepositoryImpl) UpdateProfile(profile entities.UserProfile) error {
	query := `UPDATE user_profiles 
             SET first_name = $1,
                 last_name = $2,
                 profile_picture = $3,
                 age = $4,
                 sex = $5,
                 native_language = $6,
                 languages = $7::jsonb,
                 interests = $8::text[],
                 learning_goals = $9::text[],
                 survey_complete = $10,
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $11
             RETURNING id`

	languagesJSON, err := json.Marshal(profile.Languages)
	if err != nil {
		logger.Error("Failed to marshal languages", "error", err)
		return err
	}

	var id int
	err = r.DB.QueryRow(
		query,
		profile.FirstName,
		profile.LastName,
		profile.ProfilePicture,
		profile.Age,
		profile.Sex,
		profile.NativeLanguage,
		languagesJSON,
		pq.Array(profile.Interests),
		pq.Array(profile.LearningGoals),
		profile.SurveyComplete,
		profile.UserID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update profile",
			"error", err,
			"user_id", profile.UserID)
		return err
	}

	logger.Info("Profile updated successfully", "user_id", profile.UserID)
	return nil
}

func (r *UserRepositoryImpl) UpdateSurvey(userID int, nativeLanguage string, languages []entities.LanguageLevel, interests []string, learningGoals []string) error {
	logger.Info("Updating user survey data",
		"user_id", userID,
		"native_language", nativeLanguage,
		"languages", languages,
		"interests", interests,
		"learning_goals", learningGoals)

	// First, check if profile exists
	profile, err := r.GetProfileByUserID(userID)
	if err != nil {
		logger.Error("Failed to check existing profile", "error", err)
		return err
	}

	// Marshal languages to JSON
	languagesJSON, err := json.Marshal(languages)
	if err != nil {
		logger.Error("Failed to marshal languages", "error", err)
		return err
	}

	if profile == nil {
		// Create new profile
		logger.Info("Creating new profile for survey", "user_id", userID)
		query := `
			INSERT INTO user_profiles (
				user_id, native_language, languages, interests, learning_goals, survey_complete
			) VALUES ($1, $2, $3, $4, $5, true)
			RETURNING id`

		var id int
		err = r.DB.QueryRow(
			query,
			userID,
			nativeLanguage,
			languagesJSON,
			pq.Array(interests),
			pq.Array(learningGoals),
		).Scan(&id)

		if err != nil {
			logger.Error("Failed to create profile for survey",
				"error", err,
				"user_id", userID)
			return err
		}

		logger.Info("Created new profile for survey", "user_id", userID, "profile_id", id)
		return nil
	}

	// Update existing profile
	query := `
		UPDATE user_profiles 
		SET native_language = $1,
			languages = $2::jsonb,
			interests = $3::text[],
			learning_goals = $4::text[],
			survey_complete = true,
			updated_at = CURRENT_TIMESTAMP
		WHERE user_id = $5
		RETURNING id`

	var id int
	err = r.DB.QueryRow(
		query,
		nativeLanguage,
		languagesJSON,
		pq.Array(interests),
		pq.Array(learningGoals),
		userID,
	).Scan(&id)

	if err != nil {
		logger.Error("Failed to update survey",
			"error", err,
			"user_id", userID)
		return err
	}

	logger.Info("Survey updated successfully", "user_id", userID, "profile_id", id)
	return nil
}
