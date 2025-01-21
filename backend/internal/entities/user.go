package entities

type User struct {
    ID           int    `json:"id"`
    Username     string `json:"username"`
    PasswordHash string `json:"-"`
    Role         string `json:"role"`
    Email        string `json:"email"`
    ProfilePicture string `json:"profile_picture"`
}