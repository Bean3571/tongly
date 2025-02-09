package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

	"github.com/lib/pq"
)

type UserRepositoryImpl struct {
	DB *sql.DB
}

// CreateUserCredentials creates a new user's credentials
func (r *UserRepositoryImpl) CreateUserCredentials(ctx context.Context, creds entities.UserCredentials) error {
	query := `
        INSERT INTO user_credentials (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id`

	err := r.DB.QueryRowContext(
		ctx,
		query,
		creds.Username,
		creds.Email,
		creds.PasswordHash,
		creds.Role,
	).Scan(&creds.ID)

	if err != nil {
		logger.Error("Failed to create user credentials", "error", err)
		return err
	}

	return nil
}

// GetUserByUsername retrieves a complete user by username
func (r *UserRepositoryImpl) GetUserByUsername(ctx context.Context, username string) (*entities.User, error) {
	user := &entities.User{
		Credentials: &entities.UserCredentials{},
	}

	query := `SELECT id, username, email, password_hash, role FROM user_credentials WHERE username = $1`
	err := r.DB.QueryRowContext(ctx, query, username).Scan(
		&user.Credentials.ID,
		&user.Credentials.Username,
		&user.Credentials.Email,
		&user.Credentials.PasswordHash,
		&user.Credentials.Role,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Get personal info
	user.Personal, _ = r.GetPersonalInfo(ctx, user.Credentials.ID)

	// Get role-specific details
	if user.Credentials.Role == "student" {
		user.Student, _ = r.GetStudentDetails(ctx, user.Credentials.ID)
	} else if user.Credentials.Role == "tutor" {
		user.Tutor, _ = r.GetTutorDetails(ctx, user.Credentials.ID)
	}

	return user, nil
}

// GetUserByID retrieves a complete user by ID
func (r *UserRepositoryImpl) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	user := &entities.User{
		Credentials: &entities.UserCredentials{},
	}

	query := `SELECT id, username, email, password_hash, role FROM user_credentials WHERE id = $1`
	err := r.DB.QueryRowContext(ctx, query, id).Scan(
		&user.Credentials.ID,
		&user.Credentials.Username,
		&user.Credentials.Email,
		&user.Credentials.PasswordHash,
		&user.Credentials.Role,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	// Get personal info
	user.Personal, _ = r.GetPersonalInfo(ctx, id)

	// Get role-specific details
	if user.Credentials.Role == "student" {
		user.Student, _ = r.GetStudentDetails(ctx, id)
	} else if user.Credentials.Role == "tutor" {
		user.Tutor, _ = r.GetTutorDetails(ctx, id)
	}

	return user, nil
}

// UpdateUserCredentials updates a user's credentials
func (r *UserRepositoryImpl) UpdateUserCredentials(ctx context.Context, creds entities.UserCredentials) error {
	query := `
        UPDATE user_credentials 
        SET email = $1, password_hash = $2
        WHERE id = $3`

	result, err := r.DB.ExecContext(ctx, query, creds.Email, creds.PasswordHash, creds.ID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("user not found")
	}

	return nil
}

// CreatePersonalInfo creates personal information for a user
func (r *UserRepositoryImpl) CreatePersonalInfo(ctx context.Context, info entities.UserPersonal) error {
	query := `
        INSERT INTO user_personal (user_id, first_name, last_name, profile_picture, age, sex)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`

	err := r.DB.QueryRowContext(
		ctx,
		query,
		info.UserID,
		info.FirstName,
		info.LastName,
		info.ProfilePicture,
		info.Age,
		info.Sex,
	).Scan(&info.ID)

	if err != nil {
		logger.Error("Failed to create personal info", "error", err)
		return err
	}

	return nil
}

// GetPersonalInfo retrieves personal information for a user
func (r *UserRepositoryImpl) GetPersonalInfo(ctx context.Context, userID int) (*entities.UserPersonal, error) {
	info := &entities.UserPersonal{}

	query := `
        SELECT id, user_id, first_name, last_name, profile_picture, age, sex
        FROM user_personal
        WHERE user_id = $1`

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&info.ID,
		&info.UserID,
		&info.FirstName,
		&info.LastName,
		&info.ProfilePicture,
		&info.Age,
		&info.Sex,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return info, nil
}

// UpdatePersonalInfo updates personal information for a user
func (r *UserRepositoryImpl) UpdatePersonalInfo(ctx context.Context, info entities.UserPersonal) error {
	query := `
        UPDATE user_personal 
        SET first_name = $1, last_name = $2, profile_picture = $3, age = $4, sex = $5
        WHERE user_id = $6`

	result, err := r.DB.ExecContext(
		ctx,
		query,
		info.FirstName,
		info.LastName,
		info.ProfilePicture,
		info.Age,
		info.Sex,
		info.UserID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("personal info not found")
	}

	return nil
}

// CreateStudentDetails creates student details for a user
func (r *UserRepositoryImpl) CreateStudentDetails(ctx context.Context, details entities.StudentDetails) error {
	query := `
        INSERT INTO student_details (user_id, native_languages, learning_languages, learning_goals, interests)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id`

	learningLanguagesJSON, err := json.Marshal(details.LearningLanguages)
	if err != nil {
		return err
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.UserID,
		pq.Array(details.NativeLanguages),
		learningLanguagesJSON,
		pq.Array(details.LearningGoals),
		pq.Array(details.Interests),
	).Scan(&details.ID)

	if err != nil {
		logger.Error("Failed to create student details", "error", err)
		return err
	}

	return nil
}

// GetStudentDetails retrieves student details for a user
func (r *UserRepositoryImpl) GetStudentDetails(ctx context.Context, userID int) (*entities.StudentDetails, error) {
	details := &entities.StudentDetails{}
	var learningLanguagesJSON []byte

	query := `
        SELECT id, user_id, native_languages, learning_languages, learning_goals, interests
        FROM student_details
        WHERE user_id = $1`

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
		pq.Array(&details.NativeLanguages),
		&learningLanguagesJSON,
		pq.Array(&details.LearningGoals),
		pq.Array(&details.Interests),
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(learningLanguagesJSON, &details.LearningLanguages)
	if err != nil {
		return nil, err
	}

	return details, nil
}

// UpdateStudentDetails updates student details for a user
func (r *UserRepositoryImpl) UpdateStudentDetails(ctx context.Context, details entities.StudentDetails) error {
	query := `
        UPDATE student_details 
        SET native_languages = $1, learning_languages = $2, learning_goals = $3, interests = $4
        WHERE user_id = $5`

	learningLanguagesJSON, err := json.Marshal(details.LearningLanguages)
	if err != nil {
		return err
	}

	result, err := r.DB.ExecContext(
		ctx,
		query,
		pq.Array(details.NativeLanguages),
		learningLanguagesJSON,
		pq.Array(details.LearningGoals),
		pq.Array(details.Interests),
		details.UserID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("student details not found")
	}

	return nil
}

// CreateTutorDetails creates tutor details for a user
func (r *UserRepositoryImpl) CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
        INSERT INTO tutor_details (
            user_id, bio, native_languages, teaching_languages, degrees,
            interests, hourly_rate, introduction_video, offers_trial, approved
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`

	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return err
	}

	degreesJSON, err := json.Marshal(details.Degrees)
	if err != nil {
		return err
	}

	err = r.DB.QueryRowContext(
		ctx,
		query,
		details.UserID,
		details.Bio,
		pq.Array(details.NativeLanguages),
		teachingLanguagesJSON,
		degreesJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.OffersTrial,
		details.Approved,
	).Scan(&details.ID)

	if err != nil {
		logger.Error("Failed to create tutor details", "error", err)
		return err
	}

	return nil
}

// GetTutorDetails retrieves tutor details for a user
func (r *UserRepositoryImpl) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error) {
	details := &entities.TutorDetails{}
	var teachingLanguagesJSON, degreesJSON []byte

	query := `
        SELECT id, user_id, bio, native_languages, teaching_languages, degrees,
               interests, hourly_rate, introduction_video, offers_trial, approved,
               created_at, updated_at
        FROM tutor_details
        WHERE user_id = $1`

	err := r.DB.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
		&details.Bio,
		pq.Array(&details.NativeLanguages),
		&teachingLanguagesJSON,
		&degreesJSON,
		pq.Array(&details.Interests),
		&details.HourlyRate,
		&details.IntroductionVideo,
		&details.OffersTrial,
		&details.Approved,
		&details.CreatedAt,
		&details.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(teachingLanguagesJSON, &details.TeachingLanguages)
	if err != nil {
		return nil, err
	}

	err = json.Unmarshal(degreesJSON, &details.Degrees)
	if err != nil {
		return nil, err
	}

	return details, nil
}

// UpdateTutorDetails updates tutor details for a user
func (r *UserRepositoryImpl) UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
        UPDATE tutor_details 
        SET bio = $1, native_languages = $2, teaching_languages = $3, degrees = $4,
            interests = $5, hourly_rate = $6, introduction_video = $7, offers_trial = $8
        WHERE user_id = $9`

	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return err
	}

	degreesJSON, err := json.Marshal(details.Degrees)
	if err != nil {
		return err
	}

	result, err := r.DB.ExecContext(
		ctx,
		query,
		details.Bio,
		pq.Array(details.NativeLanguages),
		teachingLanguagesJSON,
		degreesJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.OffersTrial,
		details.UserID,
	)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("tutor details not found")
	}

	return nil
}

// ListTutors retrieves a list of tutors with optional filtering
func (r *UserRepositoryImpl) ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.User, error) {
	query := `
        SELECT c.id, c.username, c.email, c.role,
               t.bio, t.native_languages, t.teaching_languages, t.degrees,
               t.interests, t.hourly_rate, t.introduction_video, t.offers_trial, t.approved,
               t.created_at, t.updated_at
        FROM user_credentials c
        JOIN tutor_details t ON c.id = t.user_id
        WHERE c.role = 'tutor'`

	// Add filters
	args := []interface{}{limit, offset}
	argCount := 3

	if v, ok := filters["approved"]; ok {
		query += ` AND t.approved = $` + string(argCount)
		args = append(args, v)
		argCount++
	}

	if v, ok := filters["min_hourly_rate"]; ok {
		query += ` AND t.hourly_rate >= $` + string(argCount)
		args = append(args, v)
		argCount++
	}

	if v, ok := filters["max_hourly_rate"]; ok {
		query += ` AND t.hourly_rate <= $` + string(argCount)
		args = append(args, v)
		argCount++
	}

	if v, ok := filters["offers_trial"]; ok {
		query += ` AND t.offers_trial = $` + string(argCount)
		args = append(args, v)
		argCount++
	}

	query += ` ORDER BY t.created_at DESC LIMIT $1 OFFSET $2`

	rows, err := r.DB.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tutors []*entities.User
	for rows.Next() {
		user := &entities.User{
			Credentials: &entities.UserCredentials{},
			Tutor:       &entities.TutorDetails{},
		}

		var teachingLanguagesJSON, degreesJSON []byte

		err := rows.Scan(
			&user.Credentials.ID,
			&user.Credentials.Username,
			&user.Credentials.Email,
			&user.Credentials.Role,
			&user.Tutor.Bio,
			pq.Array(&user.Tutor.NativeLanguages),
			&teachingLanguagesJSON,
			&degreesJSON,
			pq.Array(&user.Tutor.Interests),
			&user.Tutor.HourlyRate,
			&user.Tutor.IntroductionVideo,
			&user.Tutor.OffersTrial,
			&user.Tutor.Approved,
			&user.Tutor.CreatedAt,
			&user.Tutor.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(teachingLanguagesJSON, &user.Tutor.TeachingLanguages)
		if err != nil {
			return nil, err
		}

		err = json.Unmarshal(degreesJSON, &user.Tutor.Degrees)
		if err != nil {
			return nil, err
		}

		// Get personal info
		user.Personal, _ = r.GetPersonalInfo(ctx, user.Credentials.ID)

		tutors = append(tutors, user)
	}

	return tutors, nil
}
