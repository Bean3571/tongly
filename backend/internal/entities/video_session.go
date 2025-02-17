package entities

import "time"

// VideoSession represents a video session between a tutor and student
type VideoSession struct {
	ID        int       `json:"id" db:"id"`
	LessonID  int       `json:"lesson_id" db:"lesson_id"`
	RoomID    string    `json:"room_id" db:"room_id"`
	Token     string    `json:"token" db:"token"`
	StartTime time.Time `json:"start_time" db:"start_time"`
	EndTime   time.Time `json:"end_time,omitempty" db:"end_time"`
	Status    string    `json:"status" db:"status"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}
