package entities

type UserUpdateRequest struct {
	// User fields
	Email string `json:"email"`

	// Profile fields
	FirstName      *string         `json:"first_name,omitempty"`
	LastName       *string         `json:"last_name,omitempty"`
	ProfilePicture *string         `json:"profile_picture,omitempty"`
	Age            *int            `json:"age,omitempty"`
	Sex            *string         `json:"sex,omitempty"`
	NativeLanguage *string         `json:"native_language,omitempty"`
	Languages      []LanguageLevel `json:"languages,omitempty"`
	Interests      []string        `json:"interests,omitempty"`
	LearningGoals  []string        `json:"learning_goals,omitempty"`
	SurveyComplete *bool           `json:"survey_complete,omitempty"`
}
