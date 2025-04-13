import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/I18nContext';
import { GameType, LanguageCode } from '../../types/game';

const GamesHub: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Game options
  const games = [
    {
      id: GameType.EMOJI_QUIZ,
      title: t('games.emoji_quiz.title') || 'Emoji Quiz',
      description: t('games.emoji_quiz.description') || 'Choose the correct name of the emoji from multiple options.',
      points: 10,
      icon: '🎮',
    },
    {
      id: GameType.EMOJI_TYPING,
      title: t('games.emoji_typing.title') || 'Emoji Typing',
      description: t('games.emoji_typing.description') || 'Type the correct name of the emoji.',
      points: 20,
      icon: '⌨️',
    },
  ];

  // Language options
  const languages = [
    { code: 'en' as LanguageCode, name: t('languages.english') || 'English', flag: '🇬🇧' },
    { code: 'es' as LanguageCode, name: t('languages.spanish') || 'Spanish', flag: '🇪🇸' },
    { code: 'ru' as LanguageCode, name: t('languages.russian') || 'Russian', flag: '🇷🇺' },
  ];

  // Start a game
  const startGame = (gameType: GameType, language: LanguageCode) => {
    navigate(`/games/play/${gameType}/${language}`);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('games.hub.title') || 'Language Games'}</h1>
        <p className="text-gray-600">
          {t('games.hub.description') || 'Play games to practice your language skills and earn points!'}
        </p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/games/leaderboard')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {t('games.leaderboard') || 'View Leaderboard'} 🏆
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <div key={game.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-3">{game.icon}</span>
                <h2 className="text-xl font-bold text-gray-800">{game.title}</h2>
              </div>
              <p className="text-gray-600 mb-4">{game.description}</p>
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  {t('games.points', { count: game.points }) || `${game.points} points per game`}
                </span>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">{t('games.select_language') || 'Select Language:'}</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => startGame(game.id, language.code)}
                      className="flex items-center px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-800 rounded-lg transition-colors"
                    >
                      <span className="mr-2">{language.flag}</span>
                      {language.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesHub; 