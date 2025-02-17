/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // WebRTC Configuration
  readonly VITE_ICE_SERVERS: string;
  readonly VITE_TURN_SERVER_URL: string;
  readonly VITE_TURN_USERNAME: string;
  readonly VITE_TURN_CREDENTIAL: string;
  
  // Feature Flags
  readonly VITE_ENABLE_SCREEN_SHARE: string;
  readonly VITE_ENABLE_CHAT: string;
  readonly VITE_ENABLE_RECORDING: string;
  
  // UI Configuration
  readonly VITE_MAX_VIDEO_PARTICIPANTS: string;
  readonly VITE_DEFAULT_VIDEO_QUALITY: string;
  readonly VITE_ENABLE_VIRTUAL_BACKGROUND: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Convert environment variables to their proper types
export const getEnvConfig = () => ({
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: import.meta.env.VITE_WS_URL,
  environment: import.meta.env.VITE_ENVIRONMENT,
  
  // WebRTC Configuration
  iceServers: JSON.parse(import.meta.env.VITE_ICE_SERVERS),
  turnServerUrl: import.meta.env.VITE_TURN_SERVER_URL,
  turnUsername: import.meta.env.VITE_TURN_USERNAME,
  turnCredential: import.meta.env.VITE_TURN_CREDENTIAL,
  
  // Feature Flags
  enableScreenShare: import.meta.env.VITE_ENABLE_SCREEN_SHARE === 'true',
  enableChat: import.meta.env.VITE_ENABLE_CHAT === 'true',
  enableRecording: import.meta.env.VITE_ENABLE_RECORDING === 'true',
  
  // UI Configuration
  maxVideoParticipants: parseInt(import.meta.env.VITE_MAX_VIDEO_PARTICIPANTS, 10),
  defaultVideoQuality: import.meta.env.VITE_DEFAULT_VIDEO_QUALITY,
  enableVirtualBackground: import.meta.env.VITE_ENABLE_VIRTUAL_BACKGROUND === 'true',
}); 