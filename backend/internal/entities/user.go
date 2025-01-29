package entities

import "golang.org/x/crypto/bcrypt"

type LanguageLevel struct {
	Language string `json:"language"`
	Level    string `json:"level"`
}

// Language options
var Languages = []string{
	"English", "Spanish", "French", "German", "Chinese", "Japanese",
	"Korean", "Russian", "Arabic", "Portuguese", "Italian",
}

// Language levels (CEFR)
var LanguageLevels = []string{
	"A1", "A2", "B1", "B2", "C1", "C2",
}

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

type User struct {
	ID             int             `json:"id"`
	Username       string          `json:"username"`
	Password       string          `json:"password,omitempty"`
	PasswordHash   string          `json:"-"`
	Role           string          `json:"role"`
	Email          string          `json:"email"`
	FirstName      *string         `json:"first_name,omitempty"`
	LastName       *string         `json:"last_name,omitempty"`
	ProfilePicture *string         `json:"profile_picture,omitempty"`
	Age            *int            `json:"age,omitempty"`
	Gender         *string         `json:"gender,omitempty"`
	NativeLanguage *string         `json:"native_language,omitempty"`
	Languages      []LanguageLevel `json:"languages,omitempty"`
	Interests      []string        `json:"interests,omitempty"`
	LearningGoals  []string        `json:"learning_goals,omitempty"`
	SurveyComplete bool            `json:"survey_complete"`
}

// HashPassword hashes the user's password using bcrypt
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// ValidatePassword checks if the provided password matches the hashed password
func (u *User) ValidatePassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}
