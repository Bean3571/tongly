import { GameQuestionSet, GameType, LanguageCode, LeaderboardResponse, SaveGameResultRequest } from '../types/game';
import apiClient from './apiClient';

/**
 * Service for game-related API calls
 */
const GameService = {
  /**
   * Get questions for a game
   * @param gameType Type of the game
   * @param language Language code
   * @returns Game questions
   */
  getGameQuestions: async (gameType: GameType, language: LanguageCode): Promise<GameQuestionSet> => {
    const response = await apiClient.get<GameQuestionSet>(`/api/games/questions/${gameType}/${language}`);
    return response.data;
  },

  /**
   * Save a game result
   * @param result Game result to save
   * @returns Success status
   */
  saveGameResult: async (result: SaveGameResultRequest): Promise<{ success: boolean }> => {
    const response = await apiClient.post<{ success: boolean }>('/api/games/results', result);
    return response.data;
  },

  /**
   * Get the leaderboard
   * @returns Leaderboard data
   */
  getLeaderboard: async (): Promise<LeaderboardResponse> => {
    const response = await apiClient.get<LeaderboardResponse>('/api/games/leaderboard');
    return response.data;
  },
};

export default GameService; 