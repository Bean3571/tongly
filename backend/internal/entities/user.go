package entities

import "golang.org/x/crypto/bcrypt"

type LearningGoal string

const (
	GoalBusiness  LearningGoal = "business"  // 💼 Business
	GoalJob       LearningGoal = "job"       // 💼 Job Opportunities
	GoalStudy     LearningGoal = "study"     // 📚 Academic Studies
	GoalTrip      LearningGoal = "trip"      // ✈️ Travel
	GoalMigration LearningGoal = "migration" // 🌍 Migration
	GoalExams     LearningGoal = "exams"     // 📝 Language Exams
	GoalCulture   LearningGoal = "culture"   // 🎨 Cultural Interest
	GoalFriends   LearningGoal = "friends"   // 👥 Making Friends
	GoalHobby     LearningGoal = "hobby"     // 🎯 Personal Interest
)

// Interest categories
var Interests = []string{
	"music",       // 🎵 Music
	"movies",      // 🎬 Movies & TV Shows
	"books",       // 📚 Books & Literature
	"sports",      // ⚽ Sports
	"technology",  // 💻 Technology
	"art",         // 🎨 Art
	"cooking",     // 🍳 Cooking
	"travel",      // ✈️ Travel
	"photography", // 📷 Photography
	"gaming",      // 🎮 Gaming
	"nature",      // 🌿 Nature
	"fashion",     // 👗 Fashion
	"science",     // 🔬 Science
	"history",     // 📜 History
	"business",    // 💼 Business
	"politics",    // 🏛️ Politics
	"health",      // 🏥 Health & Wellness
	"education",   // 🎓 Education
}

// UserCredentials represents the authentication data
type UserCredentials struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	Password     string `json:"password,omitempty"`
	PasswordHash string `json:"-"`
	Email        string `json:"email"`
	Role         string `json:"role"`
}

// UserPersonal represents user's personal information
type UserPersonal struct {
	ID             int     `json:"id"`
	UserID         int     `json:"user_id"`
	FirstName      *string `json:"first_name,omitempty"`
	LastName       *string `json:"last_name,omitempty"`
	ProfilePicture *string `json:"profile_picture,omitempty"`
	Age            *int    `json:"age,omitempty"`
	Sex            *string `json:"sex,omitempty"`
}

// StudentDetails represents student-specific data
type StudentDetails struct {
	ID                int             `json:"id"`
	UserID            int             `json:"user_id"`
	NativeLanguages   []string        `json:"native_languages"`
	LearningLanguages []LanguageLevel `json:"learning_languages"`
	LearningGoals     []string        `json:"learning_goals"`
	Interests         []string        `json:"interests"`
}

// User represents the complete user data
type User struct {
	Credentials *UserCredentials `json:"credentials"`
	Personal    *UserPersonal    `json:"personal,omitempty"`
	Student     *StudentDetails  `json:"student,omitempty"`
	Tutor       *TutorDetails    `json:"tutor,omitempty"`
}

// HashPassword hashes the user's password using bcrypt
func (u *UserCredentials) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// ValidatePassword checks if the provided password matches the hashed password
func (u *UserCredentials) ValidatePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
