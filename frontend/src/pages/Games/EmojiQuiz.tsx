import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../contexts/I18nContext';
import { GameType, LanguageCode, GameQuestion, GameQuestionSet, SaveGameResultRequest } from '../../types/game';
import GameService from '../../services/gameService';
import { useAuth } from '../../contexts/AuthContext';

const EmojiQuiz: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language = 'en' } = useParams<{ language: LanguageCode }>();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [languageId, setLanguageId] = useState<number | null>(null);
  
  // Map language code to ID
  const getLanguageId = (code: string): number => {
    const languageMap: Record<string, number> = {
      en: 1, // English
      es: 2, // Spanish
      ru: 9, // Russian
    };
    return languageMap[code] || 1;
  };

  // Load questions on component mount
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const data = await GameService.getGameQuestions(GameType.EMOJI_QUIZ, language as LanguageCode);
        setQuestions(data.questions);
        setLanguageId(getLanguageId(language));
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [language]);

  // Get current question
  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (showFeedback) return;
    
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    // Check if answer is correct
    if (answer === currentQuestion.correct_answer) {
      setScore(score + 10); // 10 points per correct answer
    }
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setGameCompleted(true);
      }
    }, 1500);
  };

  // Submit score when game is completed
  useEffect(() => {
    if (gameCompleted && score > 0 && languageId) {
      const saveScore = async () => {
        try {
          const request: SaveGameResultRequest = {
            game_type: GameType.EMOJI_QUIZ,
            language_id: languageId,
            score: score
          };
          await GameService.saveGameResult(request);
        } catch (error) {
          console.error('Failed to save score:', error);
        }
      };

      saveScore();
    }
  }, [gameCompleted, score, languageId]);

  // Game completion screen
  const renderGameCompleted = () => (
    <div className="text-center p-8 bg-white rounded-xl shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">🎉 {t('games.completed') || 'Game Completed!'}</h2>
      <div className="text-5xl font-bold my-6">{score} / 50</div>
      <p className="mb-6">
        {t('games.final_score') || 'Your final score is'}: <strong>{score}</strong> {t('games.points') || 'points'}
      </p>
      <div className="flex flex-col space-y-4">
        <button
          onClick={() => navigate('/games')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {t('games.back_to_games') || 'Back to Games'}
        </button>
        <button
          onClick={() => navigate('/games/leaderboard')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
        >
          {t('games.view_leaderboard') || 'View Leaderboard'}
        </button>
      </div>
    </div>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Game completed state
  if (gameCompleted) {
    return renderGameCompleted();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('games.emoji_quiz.title') || 'Emoji Quiz'}
          <span className="ml-2 text-sm bg-orange-100 text-orange-800 py-1 px-2 rounded-lg">
            {language.toUpperCase()}
          </span>
        </h1>
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">{t('games.score') || 'Score'}:</span>
          <span className="font-medium">{score}</span>
          <span className="mx-4 text-gray-400">|</span>
          <span className="text-gray-600 mr-2">{t('games.question') || 'Question'}:</span>
          <span className="font-medium">{currentQuestionIndex + 1}/{questions.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-8">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{currentQuestion?.emoji}</div>
          <p className="text-gray-600">{t('games.emoji_quiz.instruction') || 'What is this emoji called?'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion?.options?.map((option, index) => (
            <button
              key={index}
              className={`p-4 text-left rounded-lg border-2 transition-colors ${
                showFeedback
                  ? option === currentQuestion.correct_answer
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : option === selectedAnswer
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-gray-100 border-gray-200 text-gray-800'
                  : 'bg-gray-100 hover:bg-orange-100 border-gray-200 hover:border-orange-300 text-gray-800'
              }`}
              onClick={() => handleSelectAnswer(option)}
              disabled={showFeedback}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiQuiz; 