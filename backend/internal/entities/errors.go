package entities

// TutorNotApprovedError represents an error when booking a lesson with an unapproved tutor
type TutorNotApprovedError struct {
	Message string
	Lesson  *Lesson
}

func (e *TutorNotApprovedError) Error() string {
	return e.Message
}
