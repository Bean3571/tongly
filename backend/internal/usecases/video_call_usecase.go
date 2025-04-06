package usecases

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"tongly-backend/internal/entities"
)

type VideoCallRepository interface {
	UpdateLessonVideoSession(lessonID int, sessionID, studentToken, tutorToken string) error
	LogVideoCallEvent(event *entities.VideoCallEvent) error
	GetByID(ctx context.Context, id int) (*entities.Lesson, error)
}

type VideoCallUseCase struct {
	repository VideoCallRepository
}

func NewVideoCallUseCase(repository VideoCallRepository) *VideoCallUseCase {
	return &VideoCallUseCase{
		repository: repository,
	}
}

// GenerateSessionID generates a unique session ID for a video call
func (uc *VideoCallUseCase) GenerateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return fmt.Sprintf("session_%s", base64.URLEncoding.EncodeToString(bytes)), nil
}

// GenerateToken generates a token for a user to join a video call
func (uc *VideoCallUseCase) GenerateToken(sessionID string, userID int, role string) (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	token := base64.URLEncoding.EncodeToString(bytes)
	return fmt.Sprintf("token_%s_%d_%s_%s", sessionID, userID, role, token), nil
}

// InitializeVideoSession initializes a video call session for a lesson
func (uc *VideoCallUseCase) InitializeVideoSession(lessonID int) (*entities.Lesson, error) {
	// Get the lesson
	lesson, err := uc.repository.GetByID(context.Background(), lessonID)
	if err != nil {
		return nil, err
	}

	if lesson == nil {
		return nil, entities.ErrNotFound
	}

	// Check if the lesson is ongoing or about to start
	now := time.Now()
	if now.Before(lesson.StartTime.Add(-5*time.Minute)) || now.After(lesson.EndTime) {
		return nil, errors.New("lesson is not active")
	}

	// Generate session ID and tokens if they don't exist
	var sessionID string
	var studentToken string
	var tutorToken string

	if lesson.SessionID == nil {
		// Generate new session ID and tokens
		sessionID, err = uc.GenerateSessionID()
		if err != nil {
			return nil, err
		}

		studentToken, err = uc.GenerateToken(sessionID, lesson.StudentID, "student")
		if err != nil {
			return nil, err
		}

		tutorToken, err = uc.GenerateToken(sessionID, lesson.TutorID, "tutor")
		if err != nil {
			return nil, err
		}

		// Update lesson with session information
		err = uc.repository.UpdateLessonVideoSession(lessonID, sessionID, studentToken, tutorToken)
		if err != nil {
			return nil, err
		}

		// Update the lesson object
		lesson.SessionID = &sessionID
		lesson.JoinTokenStudent = &studentToken
		lesson.JoinTokenTutor = &tutorToken
	}

	return lesson, nil
}

// LogEvent logs a video call event
func (uc *VideoCallUseCase) LogEvent(lessonID, userID int, eventType string, eventData map[string]interface{}) error {
	event := &entities.VideoCallEvent{
		LessonID:  lessonID,
		UserID:    userID,
		EventType: eventType,
		EventData: eventData,
	}

	return uc.repository.LogVideoCallEvent(event)
}

// ValidateToken validates if a token is valid for a lesson
func (uc *VideoCallUseCase) ValidateToken(lessonID int, token string) (bool, int, error) {
	lesson, err := uc.repository.GetByID(context.Background(), lessonID)
	if err != nil {
		return false, 0, err
	}

	if lesson == nil {
		return false, 0, entities.ErrNotFound
	}

	// Check if the token matches student or tutor token
	if lesson.JoinTokenStudent != nil && *lesson.JoinTokenStudent == token {
		return true, lesson.StudentID, nil
	}

	if lesson.JoinTokenTutor != nil && *lesson.JoinTokenTutor == token {
		return true, lesson.TutorID, nil
	}

	return false, 0, nil
}
