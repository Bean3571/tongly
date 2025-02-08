package entities

import "time"

// Tutor represents a user who can teach languages (private data)
type Tutor struct {
	ID                   int           `json:"id"`
	UserID               int           `json:"user_id"`
	EducationDegree      string        `json:"education_degree"`
	EducationInstitution string        `json:"education_institution"`
	IntroductionVideo    string        `json:"introduction_video"`
	HourlyRate           float64       `json:"hourly_rate"`
	OffersTrial          bool          `json:"offers_trial"`
	ApprovalStatus       string        `json:"approval_status"`
	CreatedAt            time.Time     `json:"created_at"`
	UpdatedAt            time.Time     `json:"updated_at"`
	User                 *User         `json:"user,omitempty"`
	Profile              *TutorProfile `json:"profile,omitempty"`
}

// TutorProfile represents public tutor information
type TutorProfile struct {
	ID                int             `json:"id"`
	TutorID           int             `json:"tutor_id"`
	NativeLanguages   []string        `json:"native_languages"`
	TeachingLanguages []LanguageLevel `json:"teaching_languages"`
	Bio               string          `json:"bio"`
	Interests         []string        `json:"interests"`
	ProfilePicture    string          `json:"profile_picture"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
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
	EducationDegree      string  `json:"education_degree" validate:"required"`
	EducationInstitution string  `json:"education_institution" validate:"required"`
	IntroductionVideo    string  `json:"introduction_video" validate:"required,url"`
	HourlyRate           float64 `json:"hourly_rate" validate:"required,min=5"`
	OffersTrial          bool    `json:"offers_trial"`
}

// TutorProfileUpdateRequest represents the data needed to update a tutor's profile
type TutorProfileUpdateRequest struct {
	NativeLanguages   []string        `json:"native_languages"`
	TeachingLanguages []LanguageLevel `json:"teaching_languages"`
	Bio               string          `json:"bio"`
	Interests         []string        `json:"interests"`
	ProfilePicture    string          `json:"profile_picture,omitempty"`
}
