package entities

import "time"

type LessonStatus string

const (
	LessonStatusScheduled  LessonStatus = "scheduled"
	LessonStatusInProgress LessonStatus = "in_progress"
	LessonStatusCompleted  LessonStatus = "completed"
	LessonStatusCancelled  LessonStatus = "cancelled"
)

// Lesson represents a scheduled or completed lesson
type Lesson struct {
	ID        int          `json:"id"`
	StudentID int          `json:"student_id"`
	TutorID   int          `json:"tutor_id"`
	StartTime time.Time    `json:"start_time"`
	EndTime   time.Time    `json:"end_time"`
	Status    LessonStatus `json:"status"`
	Language  string       `json:"language"`
	Price     float64      `json:"price"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
}

// VideoSession represents the video conferencing details for a lesson
type VideoSession struct {
	ID           int       `json:"id"`
	LessonID     int       `json:"lesson_id"`
	RoomID       string    `json:"room_id"`
	SessionToken string    `json:"session_token"`
	StartedAt    time.Time `json:"started_at,omitempty"`
	EndedAt      time.Time `json:"ended_at,omitempty"`
}

// LessonRating represents a student's rating for a completed lesson
type LessonRating struct {
	ID        int       `json:"id"`
	LessonID  int       `json:"lesson_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
}

// ChatMessage represents a message sent during a lesson
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
}

// LessonCancellationRequest represents the data needed to cancel a lesson
type LessonCancellationRequest struct {
	Reason string `json:"reason"`
}
