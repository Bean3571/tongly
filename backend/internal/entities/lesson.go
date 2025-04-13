package entities

import (
	"errors"
	"time"
)

// Lesson represents a scheduled or completed lesson
type Lesson struct {
	ID          int        `json:"id"`
	StudentID   int        `json:"student_id"`
	TutorID     int        `json:"tutor_id"`
	LanguageID  int        `json:"language_id"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     time.Time  `json:"end_time"`
	CancelledBy *int       `json:"cancelled_by,omitempty"`
	CancelledAt *time.Time `json:"cancelled_at,omitempty"`
	Notes       *string    `json:"notes,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`

	// Related entities (not in the database)
	Student  *User     `json:"student,omitempty"`
	Tutor    *User     `json:"tutor,omitempty"`
	Language *Language `json:"language,omitempty"`
	Reviews  []Review  `json:"reviews,omitempty"`
}

// Review represents a lesson review
type Review struct {
	ID         int       `json:"id"`
	LessonID   int       `json:"lesson_id"`
	ReviewerID int       `json:"reviewer_id"`
	Rating     int       `json:"rating"`
	CreatedAt  time.Time `json:"created_at"`

	// Related entities (not in the database)
	Reviewer *User `json:"reviewer,omitempty"`
}

// LessonStatus represents the status of a lesson (derived from timestamps)
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

// GetStatus returns the virtual status of the lesson based on time and cancelled flag
func (l *Lesson) GetStatus() LessonStatus {
	if l.CancelledAt != nil {
		return LessonStatusCancelled
	}

	now := time.Now()

	if now.Before(l.StartTime) {
		return LessonStatusScheduled
	}

	if now.After(l.StartTime) && now.Before(l.EndTime) {
		return LessonStatusInProgress
	}

	return LessonStatusCompleted
}

// CanCancel checks if the lesson can be cancelled
func (l *Lesson) CanCancel() error {
	if l.CancelledAt != nil {
		return errors.New("lesson is already cancelled")
	}

	// Only future lessons can be cancelled
	if time.Now().After(l.StartTime) {
		return ErrLessonNotCancellable
	}

	// Must be at least 24 hours before the start
	if time.Until(l.StartTime) < 24*time.Hour {
		return ErrLessonNotCancellable
	}

	return nil
}

// CanStart checks if the lesson can be started
func (l *Lesson) CanStart() error {
	if l.CancelledAt != nil {
		return errors.New("cancelled lessons cannot be started")
	}

	now := time.Now()

	// Can start 5 minutes before scheduled time
	if now.Before(l.StartTime.Add(-5 * time.Minute)) {
		return ErrLessonNotStartable
	}

	// Cannot start after end time
	if now.After(l.EndTime) {
		return ErrLessonNotStartable
	}

	return nil
}

// CanEnd checks if the lesson can be ended
func (l *Lesson) CanEnd() error {
	if l.CancelledAt != nil {
		return errors.New("cancelled lessons cannot be ended")
	}

	// Cannot end lessons that haven't started
	if time.Now().Before(l.StartTime) {
		return ErrLessonNotEndable
	}

	return nil
}

// LessonBookingRequest represents the data needed to book a new lesson
type LessonBookingRequest struct {
	TutorID    int       `json:"tutor_id"`
	LanguageID int       `json:"language_id"`
	StartTime  time.Time `json:"start_time"`
	EndTime    time.Time `json:"end_time"`
	Notes      *string   `json:"notes,omitempty"`
}

// Validate checks if the booking request is valid
func (r *LessonBookingRequest) Validate() error {
	if r.TutorID <= 0 {
		return errors.New("invalid tutor ID")
	}

	if r.LanguageID <= 0 {
		return errors.New("invalid language ID")
	}

	if r.StartTime.IsZero() {
		return errors.New("start time is required")
	}

	if r.EndTime.IsZero() {
		return errors.New("end time is required")
	}

	if r.StartTime.After(r.EndTime) {
		return errors.New("start time must be before end time")
	}

	if r.StartTime.Before(time.Now()) {
		return errors.New("start time must be in the future")
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
		return errors.New("reason is required")
	}
	return nil
}
