package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

type TutorLanguage struct {
	Language string `json:"language"`
	Level    string `json:"level"`
	IsNative bool   `json:"is_native"`
	CanTeach bool   `json:"can_teach"`
}

type AvailabilitySlot struct {
	DayOfWeek   int    `json:"day_of_week"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	IsRecurring bool   `json:"is_recurring"`
	PresetType  string `json:"preset_type"`
}

type TutorLanguages []TutorLanguage

func (t *TutorLanguages) Scan(value interface{}) error {
	if value == nil {
		*t = TutorLanguages{}
		return nil
	}
	return json.Unmarshal(value.([]byte), t)
}

func (t TutorLanguages) Value() (driver.Value, error) {
	if t == nil {
		return json.Marshal([]TutorLanguage{})
	}
	return json.Marshal(t)
}

type Availability []AvailabilitySlot

func (a *Availability) Scan(value interface{}) error {
	if value == nil {
		*a = Availability{}
		return nil
	}
	return json.Unmarshal(value.([]byte), a)
}

func (a Availability) Value() (driver.Value, error) {
	if a == nil {
		return json.Marshal([]AvailabilitySlot{})
	}
	return json.Marshal(a)
}

type StringArray []string

func (a *StringArray) Scan(value interface{}) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}
	return json.Unmarshal(value.([]byte), a)
}

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return json.Marshal([]string{})
	}
	return json.Marshal(a)
}

type Tutor struct {
	ID                 int64          `json:"id" db:"id"`
	UserID             int64          `json:"user_id" db:"user_id"`
	Bio                string         `json:"bio" db:"bio"`
	Education          StringArray    `json:"education" db:"education"`
	Certificates       StringArray    `json:"certificates" db:"certificates"`
	TeachingExperience string         `json:"teaching_experience" db:"teaching_experience"`
	HourlyRate         float64        `json:"hourly_rate" db:"hourly_rate"`
	SchedulePreset     string         `json:"schedule_preset" db:"schedule_preset"`
	MinLessonDuration  int            `json:"min_lesson_duration" db:"min_lesson_duration"`
	MaxStudents        int            `json:"max_students" db:"max_students"`
	TrialAvailable     bool           `json:"trial_lesson_available" db:"trial_available"`
	TrialPrice         *float64       `json:"trial_lesson_price,omitempty" db:"trial_price"`
	Languages          TutorLanguages `json:"languages" db:"languages"`
	Availability       Availability   `json:"availability" db:"availability"`
	CreatedAt          time.Time      `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at" db:"updated_at"`
}

type TutorRegistrationData struct {
	Bio                string             `json:"bio" validate:"required"`
	Education          []string           `json:"education" validate:"required,min=1"`
	Certificates       []string           `json:"certificates"`
	TeachingExperience string             `json:"teaching_experience" validate:"required"`
	HourlyRate         float64            `json:"hourly_rate" validate:"required,min=1"`
	SchedulePreset     string             `json:"schedule_preset" validate:"required,oneof=weekdays weekends all_week mornings evenings custom"`
	MinLessonDuration  int                `json:"min_lesson_duration" validate:"required,oneof=30 45 60 90 120"`
	MaxStudents        int                `json:"max_students" validate:"required,min=1,max=5"`
	TrialAvailable     bool               `json:"trial_lesson_available"`
	TrialPrice         *float64           `json:"trial_lesson_price" validate:"omitempty,min=0"`
	Languages          []TutorLanguage    `json:"languages" validate:"required,min=1,dive"`
	Availability       []AvailabilitySlot `json:"availability" validate:"required_if=SchedulePreset custom,omitempty,dive"`
}
