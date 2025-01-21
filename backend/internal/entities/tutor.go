package entities

type Tutor struct {
	ID           int    `json:"id"`
	UserID       int    `json:"user_id"`
	Expertise    string `json:"expertise"`
	Bio          string `json:"bio"`
	Schedule     string `json:"schedule"`
	Availability bool   `json:"availability"`
}
