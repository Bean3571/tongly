import { BaseEntity } from './common';

/**
 * Game-related types
 */

// Language code
export type LanguageCode = 'en' | 'es' | 'ru';

// Game type
export enum GameType {
  EMOJI_QUIZ = 'emoji_quiz',
  EMOJI_TYPING = 'emoji_typing',
}

// Game question for emoji quiz
export interface GameQuestion {
  emoji: string;
  correct_answer: string;
  options?: string[];
}

// Game question set
export interface GameQuestionSet {
  language: string;
  questions: GameQuestion[];
}

// Game result
export interface GameResult {
  id: number;
  user_id: number;
  game_type: string;
  language_id: number;
  score: number;
  completed_at: string;
}

// Save game result request
export interface SaveGameResultRequest {
  game_type: string;
  language_id: number;
  score: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  total_score: number;
  current_streak: number;
  longest_streak: number;
  rank: number;
}

// Leaderboard response
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  user_rank: LeaderboardEntry;
} 