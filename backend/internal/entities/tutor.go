package entities

import "time"

// TutorProfile represents a tutor's profile information
type TutorProfile struct {
	UserID          int         `json:"user_id"`
	Bio             string      `json:"bio"`
	Education       interface{} `json:"education"` // Stored as JSONB in the database
	IntroVideoURL   string      `json:"intro_video_url,omitempty"`
	Approved        bool        `json:"approved"`
	YearsExperience int         `json:"years_experience"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`

	// Related entities (not in the database)
	User         *User          `json:"user,omitempty"`
	Languages    []UserLanguage `json:"languages,omitempty"`
	Rating       float64        `json:"rating,omitempty"`
	ReviewsCount int            `json:"reviews_count,omitempty"`
}

// TutorAvailability represents a tutor's available time slot
type TutorAvailability struct {
	ID          int       `json:"id"`
	TutorID     int       `json:"tutor_id"`
	DayOfWeek   int       `json:"day_of_week"`
	StartTime   string    `json:"start_time"`
	EndTime     string    `json:"end_time"`
	IsRecurring bool      `json:"is_recurring"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TutorRegistrationRequest represents the data needed to register as a tutor
type TutorRegistrationRequest struct {
	// Basic user registration data
	Username     string `json:"username" validate:"required"`
	PasswordHash string `json:"password_hash" validate:"required"`
	Email        string `json:"email" validate:"required,email"`

	// Tutor-specific data
	Bio             string               `json:"bio"`
	Education       interface{}          `json:"education"`
	IntroVideoURL   string               `json:"intro_video_url,omitempty"`
	YearsExperience int                  `json:"years_experience"`
	Languages       []UserLanguageUpdate `json:"languages"`
}

// TutorAvailabilityRequest represents the request to add a tutor's availability
type TutorAvailabilityRequest struct {
	DayOfWeek   int    `json:"day_of_week"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	IsRecurring bool   `json:"is_recurring"`
}

// TutorUpdateRequest represents the data needed to update a tutor's profile
type TutorUpdateRequest struct {
	Bio             string      `json:"bio,omitempty"`
	Education       interface{} `json:"education,omitempty"`
	IntroVideoURL   string      `json:"intro_video_url,omitempty"`
	YearsExperience *int        `json:"years_experience,omitempty"`
}

// Education represents an educational entry
type Education struct {
	Degree       string `json:"degree"`
	Institution  string `json:"institution"`
	FieldOfStudy string `json:"field_of_study"`
	StartYear    string `json:"start_year"`
	EndYear      string `json:"end_year"`
	DocumentURL  string `json:"documentUrl,omitempty"`
}

// TutorSearchFilters represents filters for searching tutors
type TutorSearchFilters struct {
	Languages       []string `json:"languages"`
	ProficiencyID   int      `json:"proficiency_id"`    // Filter by minimum proficiency level
	Interests       []int    `json:"interests"`         // Filter by interests IDs
	Goals           []int    `json:"goals"`             // Filter by goals IDs
	YearsExperience int      `json:"years_experience"`  // Filter by minimum years of experience
	MinAge          int      `json:"min_age,omitempty"` // Filter by minimum age
	MaxAge          int      `json:"max_age,omitempty"` // Filter by maximum age
	Sex             string   `json:"sex,omitempty"`     // Filter by sex (male, female)
}
