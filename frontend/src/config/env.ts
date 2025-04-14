/**
 * Environment configuration with safe fallbacks
 * This file centralizes all environment variable access and provides defaults
 */

// Helper function to safely get environment variables with fallback values
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // Access the environment variables using process.env
  // for Create React App (which uses REACT_APP_ prefix)
  try {
    const envValue = process.env[`REACT_APP_${key}`];
    return envValue !== undefined ? String(envValue) : defaultValue;
  } catch (error) {
    console.warn(`Error accessing env var ${key}, using default:`, error);
    return defaultValue;
  }
};

// Parse JSON safely
const parseJSON = <T>(value: string, fallback: T): T => {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return fallback;
  }
};

// Parse boolean safely
const parseBoolean = (value: string): boolean => {
  return value?.toLowerCase() === 'true';
};

// Environment configuration reading from .env file
export const envConfig = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || '/api',
  wsUrl: process.env.REACT_APP_WS_URL || 'wss://localhost:8080',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  frontendUrl: process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000',
  
  // Assets
  defaultAvatar: process.env.REACT_APP_DEFAULT_AVATAR || 'https://secure.gravatar.com/avatar/default?s=200&d=mp',
  placeholderImage: process.env.REACT_APP_PLACEHOLDER_IMAGE || 'https://via.placeholder.com/80?text=Error',
  youtubeEmbedUrl: process.env.REACT_APP_YOUTUBE_EMBED_URL || 'https://www.youtube.com/embed',
  
  // WebRTC Configuration
  stunServer: process.env.REACT_APP_STUN_SERVER || 'stun:stun.l.google.com:19302',
  
  // Feature Flags (with defaults)
  enableScreenShare: parseBoolean(getEnvVar('ENABLE_SCREEN_SHARE', 'false')),
  enableChat: parseBoolean(getEnvVar('ENABLE_CHAT', 'true')),
  enableRecording: parseBoolean(getEnvVar('ENABLE_RECORDING', 'false')),
  
  // UI Configuration
  maxVideoParticipants: parseInt(getEnvVar('MAX_VIDEO_PARTICIPANTS', '2'), 10),
  defaultVideoQuality: getEnvVar('DEFAULT_VIDEO_QUALITY', '720p'),
  enableVirtualBackground: parseBoolean(getEnvVar('ENABLE_VIRTUAL_BACKGROUND', 'false')),
};

// Global type declaration for runtime config
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, string>;
  }
}

export default envConfig; 