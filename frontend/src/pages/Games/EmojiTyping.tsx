import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../contexts/I18nContext';
import { GameType, LanguageCode, GameQuestion, SaveGameResultRequest } from '../../types/game';
import GameService from '../../services/gameService';

const EmojiTyping: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { language = 'en' } = useParams<{ language: LanguageCode }>();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
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
        const data = await GameService.getGameQuestions(GameType.EMOJI_TYPING, language as LanguageCode);
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

  const currentQuestion = questions[currentQuestionIndex];

  // Calculate similarity between strings (case insensitive)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Check if one is a substring of the other
    if (s1.includes(s2) || s2.includes(s1)) {
      const longerLength = Math.max(s1.length, s2.length);
      const shorterLength = Math.min(s1.length, s2.length);
      return shorterLength / longerLength;
    }
    
    // Count matching characters
    let matches = 0;
    const maxLength = Math.max(s1.length, s2.length);
    
    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    return matches / maxLength;
  };

  // Check the answer
  const checkAnswer = () => {
    if (!currentQuestion || userAnswer.trim() === '') return;
    
    const correctAnswer = currentQuestion.correct_answer;
    const similarity = calculateSimilarity(userAnswer, correctAnswer);
    
    let points = 0;
    let correct = false;
    
    // Calculate points based on similarity
    if (similarity === 1) {
      // Perfect match
      points = 20;
      correct = true;
    } else if (similarity >= 0.8) {
      // Very close
      points = 15;
      correct = true;
    } else if (similarity >= 0.6) {
      // Close enough
      points = 10;
      correct = true;
    } else if (similarity >= 0.4) {
      // Somewhat close
      points = 5;
      correct = true;
    }
    
    setIsCorrect(correct);
    setScore(score + points);
    setShowFeedback(true);
    
    // Move to next question after delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setUserAnswer('');
        setShowFeedback(false);
      } else {
        setGameCompleted(true);
      }
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showFeedback) return;
    checkAnswer();
  };

  // Submit score when game is completed
  useEffect(() => {
    if (gameCompleted && score > 0 && languageId) {
      const saveScore = async () => {
        try {
          const request: SaveGameResultRequest = {
            game_type: GameType.EMOJI_TYPING,
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
      <div className="text-5xl font-bold my-6">{score} / 100</div>
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
          {t('games.emoji_typing.title') || 'Emoji Typing'}
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
          <p className="text-gray-600">{t('games.emoji_typing.instruction') || 'Type the name of this emoji'}</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="mb-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder={t('games.emoji_typing.placeholder') || 'Type your answer...'}
              disabled={showFeedback}
              className={`w-full p-4 border-2 rounded-lg text-lg ${
                showFeedback
                  ? isCorrect
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-red-50 border-red-500 text-red-800'
                  : 'bg-white border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
              }`}
            />
          </div>

          {showFeedback && (
            <div className={`p-4 rounded-lg mb-4 ${
              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p className="font-medium">
                {isCorrect
                  ? t('games.correct_answer') || 'Correct!'
                  : t('games.incorrect_answer') || 'Not quite right.'}
              </p>
              <p>{t('games.correct_is') || 'The correct answer is'}: <strong>{currentQuestion?.correct_answer}</strong></p>
            </div>
          )}

          <button
            type="submit"
            disabled={userAnswer.trim() === '' || showFeedback}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('games.submit_answer') || 'Submit Answer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmojiTyping; 