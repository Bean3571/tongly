package entities

type UserUpdateRequest struct {
	Email          string          `json:"email"`
	FirstName      *string         `json:"first_name,omitempty"`
	LastName       *string         `json:"last_name,omitempty"`
	ProfilePicture *string         `json:"profile_picture,omitempty"`
	Age            *int            `json:"age,omitempty"`
	NativeLanguage *string         `json:"native_language,omitempty"`
	Languages      []LanguageLevel `json:"languages,omitempty"`
	Interests      []string        `json:"interests,omitempty"`
	LearningGoals  []string        `json:"learning_goals,omitempty"`
	SurveyComplete *bool           `json:"survey_complete,omitempty"`
}
