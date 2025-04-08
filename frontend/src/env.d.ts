/// <reference types="react-scripts" />

// Type definitions for environment variables used in Create React App
interface ProcessEnv {
  // API Configuration
  readonly REACT_APP_API_URL: string;
  readonly REACT_APP_WS_URL: string;
  readonly REACT_APP_ENVIRONMENT: string;
  readonly REACT_APP_FRONTEND_URL: string;
  
  // Assets
  readonly REACT_APP_DEFAULT_AVATAR: string;
  readonly REACT_APP_PLACEHOLDER_IMAGE: string;
  readonly REACT_APP_YOUTUBE_EMBED_URL: string;
  
  // WebRTC Configuration
  readonly REACT_APP_STUN_SERVER: string;
  
  // Feature Flags
  readonly REACT_APP_ENABLE_SCREEN_SHARE: string;
  readonly REACT_APP_ENABLE_CHAT: string;
  readonly REACT_APP_ENABLE_RECORDING: string;
  
  // UI Configuration
  readonly REACT_APP_MAX_VIDEO_PARTICIPANTS: string;
  readonly REACT_APP_DEFAULT_VIDEO_QUALITY: string;
  readonly REACT_APP_ENABLE_VIRTUAL_BACKGROUND: string;
}

// Extend the NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv extends ProcessEnv {}
} 