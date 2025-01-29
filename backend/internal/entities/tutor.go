package entities

type TutorLanguage struct {
	Name     string `json:"name" db:"name"`
	Level    string `json:"level" db:"level"`
	IsNative bool   `json:"is_native" db:"is_native"`
	CanTeach bool   `json:"can_teach" db:"can_teach"`
}

type AvailabilitySlot struct {
	DayOfWeek   int    `json:"day_of_week" db:"day_of_week"`
	StartTime   string `json:"start_time" db:"start_time"`
	EndTime     string `json:"end_time" db:"end_time"`
	IsRecurring bool   `json:"is_recurring" db:"is_recurring"`
	PresetType  string `json:"preset_type" db:"preset_type"`
}

type Tutor struct {
	ID                 int                `json:"id" db:"id"`
	UserID             int                `json:"user_id" db:"user_id"`
	Bio                string             `json:"bio" db:"bio"`
	Education          []string           `json:"education" db:"education"`
	Certificates       []string           `json:"certificates" db:"certificates"`
	TeachingExperience string             `json:"teaching_experience" db:"teaching_experience"`
	HourlyRate         float64            `json:"hourly_rate" db:"hourly_rate"`
	SchedulePreset     string             `json:"schedule_preset" db:"schedule_preset"`
	MinLessonDuration  int                `json:"min_lesson_duration" db:"min_lesson_duration"`
	MaxStudents        int                `json:"max_students" db:"max_students"`
	TrialAvailable     bool               `json:"trial_available" db:"trial_available"`
	TrialPrice         *float64           `json:"trial_price,omitempty" db:"trial_price"`
	Languages          []TutorLanguage    `json:"languages" db:"languages"`
	Availability       []AvailabilitySlot `json:"availability" db:"availability"`
	CreatedAt          string             `json:"created_at" db:"created_at"`
	UpdatedAt          string             `json:"updated_at" db:"updated_at"`
}

type TutorRegistrationData struct {
	Bio                string             `json:"bio" binding:"required"`
	Education          []string           `json:"education" binding:"required"`
	Certificates       []string           `json:"certificates"`
	TeachingExperience string             `json:"teaching_experience" binding:"required"`
	HourlyRate         float64            `json:"hourly_rate" binding:"required,min=0"`
	SchedulePreset     string             `json:"schedule_preset" binding:"required"`
	MinLessonDuration  int                `json:"min_lesson_duration" binding:"required,min=15"`
	MaxStudents        int                `json:"max_students" binding:"required,min=1"`
	TrialAvailable     bool               `json:"trial_available"`
	TrialPrice         *float64           `json:"trial_price,omitempty"`
	Languages          []TutorLanguage    `json:"languages" binding:"required,min=1"`
	Availability       []AvailabilitySlot `json:"availability" binding:"required,min=1"`
}
