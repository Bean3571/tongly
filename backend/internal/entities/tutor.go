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
	HourlyRate        float64     `json:"hourly_rate"`
	IntroductionVideo string      `json:"introduction_video,omitempty"`
	Approved          bool        `json:"approved"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

// TutorProfile represents public tutor information
type TutorProfile struct {
	ID                int         `json:"id"`
	TutorID           int         `json:"tutor_id"`
	TeachingLanguages []Language  `json:"teaching_languages"`
	Bio               string      `json:"bio"`
	Interests         []string    `json:"interests"`
	ProfilePicture    string      `json:"profile_picture"`
	HourlyRate        float64     `json:"hourly_rate"`
	IntroductionVideo string      `json:"introduction_video,omitempty"`
	Education         []Education `json:"education"`
	CreatedAt         time.Time   `json:"created_at"`
	UpdatedAt         time.Time   `json:"updated_at"`
}

// TutorAvailability represents a tutor's available time slot
type TutorAvailability struct {
	ID        int       `json:"id"`
	TutorID   int       `json:"tutor_id"`
	DayOfWeek int       `json:"day_of_week"`
	StartTime string    `json:"start_time"`
	EndTime   string    `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TutorReview represents a review for a tutor
type TutorReview struct {
	ID         int       `json:"id"`
	TutorID    int       `json:"tutor_id"`
	ReviewerID int       `json:"reviewer_id"`
	Rating     int       `json:"rating"`
	Comment    string    `json:"comment"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
	Reviewer   *User     `json:"reviewer,omitempty"`
}

// TutorRegistrationRequest represents the data needed to register as a tutor
type TutorRegistrationRequest struct {
	Bio               string      `json:"bio"`
	TeachingLanguages []Language  `json:"teaching_languages"`
	Education         []Education `json:"education"`
	HourlyRate        float64     `json:"hourly_rate"`
	IntroductionVideo string      `json:"introduction_video"`
}

// TutorUpdateRequest represents the data needed to update a tutor's profile
type TutorUpdateRequest struct {
	Bio               string      `json:"bio"`
	TeachingLanguages []Language  `json:"teaching_languages"`
	Education         []Education `json:"education"`
	Interests         []string    `json:"interests"`
	HourlyRate        float64     `json:"hourly_rate"`
	IntroductionVideo string      `json:"introduction_video,omitempty"`
}

type Language struct {
	Language string `json:"language"`
	Level    string `json:"level"`
}

type Education struct {
	Degree       string `json:"degree"`
	Institution  string `json:"institution"`
	FieldOfStudy string `json:"field_of_study"`
	StartYear    string `json:"start_year"`
	EndYear      string `json:"end_year"`
	DocumentURL  string `json:"documentUrl,omitempty"`
}

type TutorSearchFilters struct {
	Languages []string `json:"languages"`
	MinPrice  float64  `json:"min_price"`
	MaxPrice  float64  `json:"max_price"`
	MinRating float64  `json:"min_rating"`
}
