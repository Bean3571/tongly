package repositories

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/logger"

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

// CreateUserCredentials creates a new user's credentials
func (r *userRepositoryImpl) CreateUserCredentials(ctx context.Context, creds entities.UserCredentials) error {
	query := `
        INSERT INTO user_credentials (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id`

	err := r.db.QueryRowContext(
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
func (r *userRepositoryImpl) GetUserByUsername(ctx context.Context, username string) (*entities.User, error) {
	user := &entities.User{
		Credentials: &entities.UserCredentials{},
	}

	query := `SELECT id, username, email, password_hash, role FROM user_credentials WHERE username = $1`
	err := r.db.QueryRowContext(ctx, query, username).Scan(
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
func (r *userRepositoryImpl) GetUserByID(ctx context.Context, id int) (*entities.User, error) {
	user := &entities.User{
		Credentials: &entities.UserCredentials{},
	}

	query := `SELECT id, username, email, password_hash, role FROM user_credentials WHERE id = $1`
	err := r.db.QueryRowContext(ctx, query, id).Scan(
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
func (r *userRepositoryImpl) UpdateUserCredentials(ctx context.Context, creds entities.UserCredentials) error {
	query := `
        UPDATE user_credentials 
        SET email = $1, password_hash = $2
        WHERE id = $3`

	result, err := r.db.ExecContext(ctx, query, creds.Email, creds.PasswordHash, creds.ID)
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
func (r *userRepositoryImpl) CreatePersonalInfo(ctx context.Context, info entities.UserPersonal) error {
	query := `
        INSERT INTO user_personal (user_id, first_name, last_name, profile_picture, age, sex)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`

	err := r.db.QueryRowContext(
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
func (r *userRepositoryImpl) GetPersonalInfo(ctx context.Context, userID int) (*entities.UserPersonal, error) {
	info := &entities.UserPersonal{}

	query := `
        SELECT id, user_id, first_name, last_name, profile_picture, age, sex
        FROM user_personal
        WHERE user_id = $1`

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
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
func (r *userRepositoryImpl) UpdatePersonalInfo(ctx context.Context, info entities.UserPersonal) error {
	query := `
        UPDATE user_personal 
        SET first_name = $1, last_name = $2, profile_picture = $3, age = $4, sex = $5
        WHERE user_id = $6`

	result, err := r.db.ExecContext(
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
func (r *userRepositoryImpl) CreateStudentDetails(ctx context.Context, details entities.StudentDetails) error {
	query := `
        INSERT INTO student_details (user_id, learning_languages, learning_goals, interests)
        VALUES ($1, $2, $3, $4)
        RETURNING id`

	learningLanguagesJSON, err := json.Marshal(details.LearningLanguages)
	if err != nil {
		return err
	}

	err = r.db.QueryRowContext(
		ctx,
		query,
		details.UserID,
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
func (r *userRepositoryImpl) GetStudentDetails(ctx context.Context, userID int) (*entities.StudentDetails, error) {
	details := &entities.StudentDetails{}
	var learningLanguagesJSON []byte

	query := `
        SELECT id, user_id, learning_languages, learning_goals, interests
        FROM student_details
        WHERE user_id = $1`

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
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
func (r *userRepositoryImpl) UpdateStudentDetails(ctx context.Context, details entities.StudentDetails) error {
	query := `
        UPDATE student_details 
        SET learning_languages = $1, learning_goals = $2, interests = $3
        WHERE user_id = $4`

	learningLanguagesJSON, err := json.Marshal(details.LearningLanguages)
	if err != nil {
		return err
	}

	result, err := r.db.ExecContext(
		ctx,
		query,
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
func (r *userRepositoryImpl) CreateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
        INSERT INTO tutor_details (
            user_id, bio, teaching_languages, education,
            interests, hourly_rate, introduction_video, approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(details.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	err = r.db.QueryRowContext(
		ctx,
		query,
		details.UserID,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.Approved,
	).Scan(&details.ID)

	if err != nil {
		logger.Error("Failed to create tutor details", "error", err)
		return fmt.Errorf("failed to create tutor details: %v", err)
	}

	return nil
}

// GetTutorDetails retrieves tutor details for a user
func (r *userRepositoryImpl) GetTutorDetails(ctx context.Context, userID int) (*entities.TutorDetails, error) {
	query := `
        SELECT id, user_id, bio, teaching_languages, education,
               interests, hourly_rate, introduction_video, approved,
               created_at, updated_at
        FROM tutor_details
        WHERE user_id = $1`

	var details entities.TutorDetails
	var teachingLanguagesJSON, educationJSON []byte

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&details.ID,
		&details.UserID,
		&details.Bio,
		&teachingLanguagesJSON,
		&educationJSON,
		pq.Array(&details.Interests),
		&details.HourlyRate,
		&details.IntroductionVideo,
		&details.Approved,
		&details.CreatedAt,
		&details.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		logger.Error("Failed to get tutor details", "error", err)
		return nil, fmt.Errorf("failed to get tutor details: %v", err)
	}

	// Unmarshal JSON fields
	if err := json.Unmarshal(teachingLanguagesJSON, &details.TeachingLanguages); err != nil {
		return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
	}
	if err := json.Unmarshal(educationJSON, &details.Education); err != nil {
		return nil, fmt.Errorf("failed to unmarshal education: %v", err)
	}

	return &details, nil
}

// UpdateTutorDetails updates tutor details for a user
func (r *userRepositoryImpl) UpdateTutorDetails(ctx context.Context, details *entities.TutorDetails) error {
	query := `
        UPDATE tutor_details
        SET bio = $1,
            teaching_languages = $2,
            education = $3,
            interests = $4,
            hourly_rate = $5,
            introduction_video = $6,
            approved = $7
        WHERE user_id = $8`

	// Convert arrays to JSONB
	teachingLanguagesJSON, err := json.Marshal(details.TeachingLanguages)
	if err != nil {
		return fmt.Errorf("failed to marshal teaching languages: %v", err)
	}

	educationJSON, err := json.Marshal(details.Education)
	if err != nil {
		return fmt.Errorf("failed to marshal education: %v", err)
	}

	result, err := r.db.ExecContext(
		ctx,
		query,
		details.Bio,
		teachingLanguagesJSON,
		educationJSON,
		pq.Array(details.Interests),
		details.HourlyRate,
		details.IntroductionVideo,
		details.Approved,
		details.UserID,
	)

	if err != nil {
		logger.Error("Failed to update tutor details", "error", err)
		return fmt.Errorf("failed to update tutor details: %v", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rows == 0 {
		return fmt.Errorf("tutor details not found for user ID: %d", details.UserID)
	}

	return nil
}

// ListTutors retrieves a list of tutors with optional filtering
func (r *userRepositoryImpl) ListTutors(ctx context.Context, limit, offset int, filters map[string]interface{}) ([]*entities.User, error) {
	query := `
        WITH tutor_data AS (
            SELECT 
                uc.id as user_id,
                uc.username,
                uc.email,
                uc.role,
                up.first_name,
                up.last_name,
                up.profile_picture,
                td.bio,
                td.teaching_languages,
                td.education,
                td.interests,
                td.hourly_rate,
                td.introduction_video,
                td.approved
            FROM user_credentials uc
            LEFT JOIN user_personal up ON uc.id = up.user_id
            LEFT JOIN tutor_details td ON uc.id = td.user_id
            WHERE uc.role = 'tutor'
        )
        SELECT * FROM tutor_data WHERE 1=1`

	args := []interface{}{}
	argPosition := 1

	// Add filters
	if language, ok := filters["language"].(string); ok && language != "" {
		query += ` AND teaching_languages @> $` + strconv.Itoa(argPosition) + `::jsonb`
		languageFilter := fmt.Sprintf(`[{"language":"%s"}]`, language)
		args = append(args, languageFilter)
		argPosition++
	}

	if minRate, ok := filters["min_hourly_rate"].(float64); ok && minRate > 0 {
		query += ` AND hourly_rate >= $` + strconv.Itoa(argPosition)
		args = append(args, minRate)
		argPosition++
	}

	if maxRate, ok := filters["max_hourly_rate"].(float64); ok && maxRate > 0 {
		query += ` AND hourly_rate <= $` + strconv.Itoa(argPosition)
		args = append(args, maxRate)
		argPosition++
	}

	// Add pagination
	query += ` ORDER BY user_id DESC LIMIT $` + strconv.Itoa(argPosition) +
		` OFFSET $` + strconv.Itoa(argPosition+1)
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		logger.Error("Failed to list tutors", "error", err)
		return nil, fmt.Errorf("failed to list tutors: %v", err)
	}
	defer rows.Close()

	var tutors []*entities.User
	for rows.Next() {
		var (
			user             entities.User
			creds            entities.UserCredentials
			personal         entities.UserPersonal
			details          entities.TutorDetails
			teachingLangJSON []byte
			educationJSON    []byte
		)

		err := rows.Scan(
			&creds.ID,
			&creds.Username,
			&creds.Email,
			&creds.Role,
			&personal.FirstName,
			&personal.LastName,
			&personal.ProfilePicture,
			&details.Bio,
			&teachingLangJSON,
			&educationJSON,
			pq.Array(&details.Interests),
			&details.HourlyRate,
			&details.IntroductionVideo,
			&details.Approved,
		)

		if err != nil {
			logger.Error("Failed to scan tutor row", "error", err)
			return nil, fmt.Errorf("failed to scan tutor row: %v", err)
		}

		if err := json.Unmarshal(teachingLangJSON, &details.TeachingLanguages); err != nil {
			return nil, fmt.Errorf("failed to unmarshal teaching languages: %v", err)
		}

		if err := json.Unmarshal(educationJSON, &details.Education); err != nil {
			return nil, fmt.Errorf("failed to unmarshal education: %v", err)
		}

		user.Credentials = &creds
		user.Personal = &personal
		user.Tutor = &details
		tutors = append(tutors, &user)
	}

	return tutors, nil
}
