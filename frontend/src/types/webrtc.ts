export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

export interface SignalingMessage {
  type: 'peers' | 'offer' | 'answer' | 'ice-candidate' | 'get-peers';
  from?: number;
  to?: number;
  payload: string;
}

export type NetworkQuality = 'good' | 'fair' | 'poor';

declare global {
  interface ImportMetaEnv {
    VITE_API_URL: string;
    VITE_WS_URL: string;
    VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
    
    // WebRTC Configuration
    VITE_ICE_SERVERS: string;
    VITE_TURN_SERVER_URL: string;
    VITE_TURN_USERNAME: string;
    VITE_TURN_CREDENTIAL: string;
    
    // Feature Flags
    VITE_ENABLE_SCREEN_SHARE: string;
    VITE_ENABLE_CHAT: string;
    VITE_ENABLE_RECORDING: string;
    
    // UI Configuration
    VITE_MAX_VIDEO_PARTICIPANTS: string;
    VITE_DEFAULT_VIDEO_QUALITY: string;
    VITE_ENABLE_VIRTUAL_BACKGROUND: string;
  }
} 