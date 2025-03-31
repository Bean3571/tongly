package entities

import "time"

// TutorDetails represents tutor-specific data
type TutorDetails struct {
	ID                int         `json:"id"`
	UserID            int         `json:"user_id"`
	Bio               string      `json:"bio"`
	TeachingLanguages []Language  `json:"teaching_languages"`
	Education         []Education `json:"education"`
	Interests         []string    `json:"interests"`
	IntroductionVideo string      `json:"introduction_video,omitempty"`
	Approved          bool        `json:"approved"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

// TutorProfile represents a tutor's profile information
type TutorProfile struct {
	ID                int            `json:"id"`
	UserID            int            `json:"user_id"`
	Bio               string         `json:"bio"`
	TeachingLanguages []Language     `json:"teaching_languages"`
	Education         interface{}    `json:"education"` // Using interface{} to match request types
	Interests         []int          `json:"interests"`
	ProfilePictureURL *string        `json:"profile_picture_url,omitempty"`
	IntroductionVideo string         `json:"introduction_video,omitempty"`
	Approved          bool           `json:"approved"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	User              *User          `json:"user,omitempty"`
	Languages         []UserLanguage `json:"languages,omitempty"`
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
	Bio               string                     `json:"bio"`
	Education         interface{}                `json:"education"`
	IntroductionVideo string                     `json:"introduction_video,omitempty"`
	TeachingLanguages []UserLanguageUpdate       `json:"teaching_languages"`
	Availability      []TutorAvailabilityRequest `json:"availability,omitempty"`
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
	Bio               string               `json:"bio,omitempty"`
	Education         interface{}          `json:"education,omitempty"`
	IntroductionVideo string               `json:"introduction_video,omitempty"`
	YearsExperience   *int                 `json:"years_experience,omitempty"`
	TeachingLanguages []UserLanguageUpdate `json:"teaching_languages,omitempty"`
	Interests         []int                `json:"interests,omitempty"`
}

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
	Languages []string `json:"languages"`
}
