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
export const getEnvConfig = () => {
  return {
    apiUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080',
    environment: 'development',
    
    // WebRTC Configuration
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    turnServerUrl: '',
    turnUsername: '',
    turnCredential: '',
    
    // Feature Flags
    enableScreenShare: false,
    enableChat: true,
    enableRecording: false,
    
    // UI Configuration
    maxVideoParticipants: 2,
    defaultVideoQuality: '720p',
    enableVirtualBackground: false,
  };
}; 