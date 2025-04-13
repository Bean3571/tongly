package usecases

import (
	"context"
	"math/rand"
	"tongly-backend/internal/entities"
	"tongly-backend/internal/repositories"
)

// GameUseCase handles business logic for games
type GameUseCase struct {
	gameRepo     *repositories.GameRepository
	languageRepo *repositories.LanguageRepository
}

// NewGameUseCase creates a new GameUseCase
func NewGameUseCase(gameRepo *repositories.GameRepository, languageRepo *repositories.LanguageRepository) *GameUseCase {
	return &GameUseCase{
		gameRepo:     gameRepo,
		languageRepo: languageRepo,
	}
}

// GenerateGameQuestions generates questions for a game
func (uc *GameUseCase) GenerateGameQuestions(ctx context.Context, gameType string, language string, questionCount int) (*entities.GameQuestionSet, error) {
	// Get random emojis for the questions
	emojis, err := uc.gameRepo.GetRandomEmojis(ctx, questionCount)
	if err != nil {
		return nil, err
	}

	// Create game questions
	questions := make([]entities.GameQuestion, 0, questionCount)
	for _, emoji := range emojis {
		var correctAnswer string
		switch language {
		case "en":
			correctAnswer = emoji.NameEN
		case "es":
			correctAnswer = emoji.NameES
		case "ru":
			correctAnswer = emoji.NameRU
		default:
			correctAnswer = emoji.NameEN
		}

		question := entities.GameQuestion{
			Emoji:         emoji.Emoji,
			CorrectAnswer: correctAnswer,
		}

		if gameType == "emoji_quiz" {
			// For quiz game, generate 3 wrong options
			// Get more emojis to use as wrong options
			wrongEmojis, err := uc.gameRepo.GetRandomEmojis(ctx, 10)
			if err != nil {
				return nil, err
			}

			// Filter out the current emoji
			wrongOptions := make([]string, 0, 3)
			for _, wrongEmoji := range wrongEmojis {
				if wrongEmoji.ID == emoji.ID {
					continue
				}

				var wrongAnswer string
				switch language {
				case "en":
					wrongAnswer = wrongEmoji.NameEN
				case "es":
					wrongAnswer = wrongEmoji.NameES
				case "ru":
					wrongAnswer = wrongEmoji.NameRU
				default:
					wrongAnswer = wrongEmoji.NameEN
				}

				wrongOptions = append(wrongOptions, wrongAnswer)
				if len(wrongOptions) >= 3 {
					break
				}
			}

			// Create options by combining correct and wrong answers
			options := append([]string{correctAnswer}, wrongOptions...)
			// Shuffle options
			rand.Shuffle(len(options), func(i, j int) {
				options[i], options[j] = options[j], options[i]
			})

			question.Options = options
		}

		questions = append(questions, question)
	}

	return &entities.GameQuestionSet{
		Language:  language,
		Questions: questions,
	}, nil
}

// SaveGameResult saves a game result and updates the user's streak
func (uc *GameUseCase) SaveGameResult(ctx context.Context, userID int, request *entities.SaveGameResultRequest) error {
	// Create the result
	result := &entities.GameResult{
		UserID:     userID,
		GameType:   request.GameType,
		LanguageID: request.LanguageID,
		Score:      request.Score,
	}

	// Save the result
	if err := uc.gameRepo.SaveGameResult(ctx, result); err != nil {
		return err
	}

	// Update the user's streak
	if err := uc.gameRepo.UpdateStudentStreak(ctx, userID); err != nil {
		return err
	}

	return nil
}

// GetLeaderboard gets the leaderboard and the user's rank
func (uc *GameUseCase) GetLeaderboard(ctx context.Context, userID int) ([]entities.LeaderboardEntry, *entities.LeaderboardEntry, error) {
	// Get top 5 users
	leaderboard, err := uc.gameRepo.GetLeaderboard(ctx, 5)
	if err != nil {
		return nil, nil, err
	}

	// Get the user's rank
	userRank, err := uc.gameRepo.GetUserRank(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	return leaderboard, userRank, nil
}
