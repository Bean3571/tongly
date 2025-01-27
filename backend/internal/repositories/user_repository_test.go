package repositories

import (
	"testing"
	"tongly/backend/internal/entities"
	"tongly/backend/internal/testutil"
)

func TestUserRepository(t *testing.T) {
	db := testutil.SetupTestDB(t)
	defer db.Close()

	repo := &UserRepositoryImpl{DB: db}

	t.Run("CreateAndGetUser", func(t *testing.T) {
		defer testutil.CleanupTestDB(t, db)

		firstName := "John"
		lastName := "Doe"
		profilePic := "http://example.com/pic.jpg"

		user := entities.User{
			Username:       "testuser",
			Role:           "student",
			Email:          "test@example.com",
			FirstName:      &firstName,
			LastName:       &lastName,
			ProfilePicture: &profilePic,
		}

		err := user.HashPassword("password123")
		if err != nil {
			t.Fatalf("Failed to hash password: %v", err)
		}

		// Test Create
		err = repo.CreateUser(user)
		if err != nil {
			t.Fatalf("Failed to create user: %v", err)
		}

		// Test Get
		savedUser, err := repo.GetUserByUsername("testuser")
		if err != nil {
			t.Fatalf("Failed to get user: %v", err)
		}

		if savedUser.Email != user.Email {
			t.Errorf("Expected email %s, got %s", user.Email, savedUser.Email)
		}
	})

	t.Run("UpdateUser", func(t *testing.T) {
		defer testutil.CleanupTestDB(t, db)

		// Create initial user
		user := entities.User{
			Username: "updatetest",
			Role:     "student",
			Email:    "initial@example.com",
		}

		err := user.HashPassword("password123")
		if err != nil {
			t.Fatalf("Failed to hash password: %v", err)
		}

		err = repo.CreateUser(user)
		if err != nil {
			t.Fatalf("Failed to create user: %v", err)
		}

		// Get the created user
		savedUser, err := repo.GetUserByUsername("updatetest")
		if err != nil {
			t.Fatalf("Failed to get user: %v", err)
		}

		// Update user
		newEmail := "updated@example.com"
		newFirstName := "Updated"
		newLastName := "User"
		newProfilePic := "http://example.com/new.jpg"

		savedUser.Email = newEmail
		savedUser.FirstName = &newFirstName
		savedUser.LastName = &newLastName
		savedUser.ProfilePicture = &newProfilePic

		err = repo.UpdateUser(*savedUser)
		if err != nil {
			t.Fatalf("Failed to update user: %v", err)
		}

		// Verify updates
		updatedUser, err := repo.GetUserByUsername("updatetest")
		if err != nil {
			t.Fatalf("Failed to get updated user: %v", err)
		}

		if updatedUser.Email != newEmail {
			t.Errorf("Expected email %s, got %s", newEmail, updatedUser.Email)
		}

		if *updatedUser.FirstName != newFirstName {
			t.Errorf("Expected first name %s, got %s", newFirstName, *updatedUser.FirstName)
		}
	})
}
