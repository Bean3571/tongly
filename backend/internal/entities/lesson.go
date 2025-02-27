package entities

import (
	"errors"
	"time"
)

type LessonStatus string

const (
	LessonStatusScheduled  LessonStatus = "scheduled"
	LessonStatusInProgress LessonStatus = "in_progress"
	LessonStatusCompleted  LessonStatus = "completed"
	LessonStatusCancelled  LessonStatus = "cancelled"
)

var (
	ErrInvalidStatusTransition = errors.New("invalid lesson status transition")
	ErrLessonNotCancellable    = errors.New("lesson cannot be cancelled at this time")
	ErrLessonNotStartable      = errors.New("lesson cannot be started at this time")
	ErrLessonNotEndable        = errors.New("lesson cannot be ended at this time")
)

// IsValidTransition checks if the status transition is valid
func (s LessonStatus) IsValidTransition(newStatus LessonStatus) bool {
	validTransitions := map[LessonStatus][]LessonStatus{
		LessonStatusScheduled: {
			LessonStatusInProgress,
			LessonStatusCancelled,
		},
		LessonStatusInProgress: {
			LessonStatusCompleted,
			LessonStatusInProgress, // Allow re-joining in_progress lessons
		},
		LessonStatusCompleted: {}, // No valid transitions from completed
		LessonStatusCancelled: {}, // No valid transitions from cancelled
	}

	// If transitioning to the same status, it's valid
	if s == newStatus {
		return true
	}

	allowed, exists := validTransitions[s]
	if !exists {
		return false
	}

	for _, status := range allowed {
		if status == newStatus {
			return true
		}
	}
	return false
}

// Participant represents a user in a lesson (student or tutor)
type Participant struct {
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
	Username  string  `json:"username"`
	AvatarURL *string `json:"avatar_url,omitempty"`
}

// Lesson represents a scheduled or completed lesson
type Lesson struct {
	ID        int          `json:"id"`
	StudentID int          `json:"student_id"`
	TutorID   int          `json:"tutor_id"`
	Student   Participant  `json:"student"`
	Tutor     Participant  `json:"tutor"`
	StartTime time.Time    `json:"start_time"`
	EndTime   time.Time    `json:"end_time"`
	Duration  int          `json:"duration"` // in minutes
	Status    LessonStatus `json:"status"`
	Language  string       `json:"language"`
	Price     float64      `json:"price"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// CanCancel checks if the lesson can be cancelled
func (l *Lesson) CanCancel() error {
	if !l.Status.IsValidTransition(LessonStatusCancelled) {
		return ErrInvalidStatusTransition
	}

	if time.Until(l.StartTime) < 24*time.Hour {
		return ErrLessonNotCancellable
	}

	return nil
}

// CanStart checks if the lesson can be started
func (l *Lesson) CanStart() error {
	if l.Status != LessonStatusScheduled && l.Status != LessonStatusInProgress {
		return ErrInvalidStatusTransition
	}

	now := time.Now()
	if now.Before(l.StartTime.Add(-5 * time.Minute)) {
		return ErrLessonNotStartable
	}
	if now.After(l.EndTime) {
		return ErrLessonNotStartable
	}

	return nil
}

// CanEnd checks if the lesson can be ended
func (l *Lesson) CanEnd() error {
	if !l.Status.IsValidTransition(LessonStatusCompleted) {
		return ErrInvalidStatusTransition
	}

	if time.Now().Before(l.StartTime) {
		return ErrLessonNotEndable
	}

	return nil
}

// LessonRating represents a student's rating for a completed lesson
type LessonRating struct {
	ID        int       `json:"id"`
	LessonID  int       `json:"lesson_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatMessage struct {
	ID        int       `json:"id"`
	LessonID  int       `json:"lesson_id"`
	SenderID  int       `json:"sender_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

// LessonBookingRequest represents the data needed to book a new lesson
type LessonBookingRequest struct {
	TutorID   int       `json:"tutor_id"`
	StartTime time.Time `json:"start_time"`
	Language  string    `json:"language"`
	Duration  int       `json:"duration"` // Duration in minutes
}

// Validate checks if the booking request is valid
func (r *LessonBookingRequest) Validate() error {
	if r.TutorID <= 0 {
		return errors.New("invalid tutor ID")
	}

	if r.StartTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
	}

	if r.Duration <= 0 {
		return errors.New("duration must be positive")
	}

	if r.Language == "" {
		return errors.New("language is required")
	}

	return nil
}

// LessonCancellationRequest represents the data needed to cancel a lesson
type LessonCancellationRequest struct {
	Reason string `json:"reason"`
}

// Validate checks if the cancellation request is valid
func (r *LessonCancellationRequest) Validate() error {
	if r.Reason == "" {
		return errors.New("cancellation reason is required")
	}
	return nil
}
