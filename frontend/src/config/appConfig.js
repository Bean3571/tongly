// App-wide configuration that doesn't depend on Vite's import.meta.env
// This provides fallback values that work without environment variables

const appConfig = {
  // API Configuration
  api: {
    baseUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080',
    timeout: 30000,
    retryAttempts: 3,
  },
  
  // WebRTC configuration
  webrtc: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    turnServerUrl: '',
    turnUsername: '',
    turnCredential: '',
  },
  
  // Feature flags
  features: {
    enableScreenShare: true,
    enableChat: true,
    enableRecording: false,
    enableVirtualBackground: false,
  },
  
  // UI configuration
  ui: {
    maxVideoParticipants: 4,
    defaultVideoQuality: '720p',
  },
};

export default appConfig; 