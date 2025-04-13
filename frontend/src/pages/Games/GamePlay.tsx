import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { GameType, LanguageCode } from '../../types/game';
import EmojiQuiz from './EmojiQuiz';
import EmojiTyping from './EmojiTyping';

const GamePlay: React.FC = () => {
  const { gameType, language } = useParams<{ gameType: string; language: string }>();

  // Validate language
  const isValidLanguage = (lang?: string): lang is LanguageCode => {
    return lang === 'en' || lang === 'es' || lang === 'ru';
  };

  if (!isValidLanguage(language)) {
    return <Navigate to="/games" />;
  }

  // Render the appropriate game based on the type
  switch (gameType) {
    case GameType.EMOJI_QUIZ:
      return <EmojiQuiz />;
    case GameType.EMOJI_TYPING:
      return <EmojiTyping />;
    default:
      return <Navigate to="/games" />;
  }
};

export default GamePlay; 