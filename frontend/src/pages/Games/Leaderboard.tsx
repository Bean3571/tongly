import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/I18nContext';
import { LeaderboardEntry } from '../../types/game';
import GameService from '../../services/gameService';
import { useAuth } from '../../contexts/AuthContext';

const Leaderboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await GameService.getLeaderboard();
        setLeaderboard(data.leaderboard);
        setUserRank(data.user_rank);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center p-8">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/games')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {t('games.back_to_games') || 'Back to Games'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('games.leaderboard_title') || 'Language Games Leaderboard'} 🏆
          </h1>
          <p className="text-gray-600">
            {t('games.leaderboard_description') || 'See who\'s leading in language learning games!'}
          </p>
        </div>
        <button
          onClick={() => navigate('/games')}
          className="mt-4 md:mt-0 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {t('games.back_to_games') || 'Back to Games'}
        </button>
      </div>

      {/* Top 5 Players */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-orange-50 p-4 border-b border-orange-100">
          <h2 className="text-xl font-bold text-gray-800">
            {t('games.top_players') || 'Top Players'}
          </h2>
        </div>
        <div className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('games.rank') || 'Rank'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('games.player') || 'Player'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('games.score') || 'Score'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('games.streak') || 'Streak'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => (
                <tr key={entry.user_id} className={entry.user_id === user?.id ? 'bg-orange-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-xl mr-2">🥇</span>}
                      {index === 1 && <span className="text-xl mr-2">🥈</span>}
                      {index === 2 && <span className="text-xl mr-2">🥉</span>}
                      {index > 2 && <span className="font-medium">{entry.rank}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {entry.first_name} {entry.last_name}
                    </div>
                    <div className="text-sm text-gray-500">@{entry.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{entry.total_score}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{entry.current_streak}</span>
                      <span className="mx-1 text-gray-400">|</span>
                      <span className="text-sm text-gray-500">{t('games.longest') || 'Longest'}: {entry.longest_streak}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t('games.no_players') || 'No players on the leaderboard yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Stats */}
      {userRank && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-orange-50 p-4 border-b border-orange-100">
            <h2 className="text-xl font-bold text-gray-800">
              {t('games.your_stats') || 'Your Stats'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('games.your_rank') || 'Your Rank'}</div>
                <div className="text-2xl font-bold">{userRank.rank}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('games.total_score') || 'Total Score'}</div>
                <div className="text-2xl font-bold">{userRank.total_score}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">{t('games.streaks') || 'Streaks'}</div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-bold">{userRank.current_streak}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    {t('games.current') || 'Current'} / {userRank.longest_streak} {t('games.longest') || 'Longest'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard; 