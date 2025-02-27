package entities

import "time"

type RoomParticipant struct {
	ID        int        `json:"id"`
	LessonID  int        `json:"lesson_id"`
	UserID    int        `json:"user_id"`
	Username  string     `json:"username"`
	FirstName *string    `json:"first_name,omitempty"`
	LastName  *string    `json:"last_name,omitempty"`
	AvatarURL *string    `json:"avatar_url,omitempty"`
	JoinedAt  time.Time  `json:"joined_at"`
	LeftAt    *time.Time `json:"left_at,omitempty"`
}

// VideoSession represents a video session between a tutor and student
type VideoSession struct {
	ID           int               `json:"id" db:"id"`
	LessonID     int               `json:"lesson_id" db:"lesson_id"`
	RoomID       string            `json:"room_id" db:"room_id"`
	Token        string            `json:"token" db:"session_token"`
	StartTime    time.Time         `json:"start_time" db:"started_at"`
	EndTime      *time.Time        `json:"end_time,omitempty" db:"ended_at"`
	CreatedAt    time.Time         `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at" db:"updated_at"`
	Participants []RoomParticipant `json:"participants"`
}
