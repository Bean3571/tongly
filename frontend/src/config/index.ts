/**
 * Central application configuration
 * 
 * This file consolidates all configuration settings and ensures they're available
 * throughout the application with proper fallbacks and validation.
 */

import { envConfig } from './env';

// Application-wide configuration
export const config = {
  // API and backend configuration
  api: {
    baseUrl: envConfig.apiUrl,
    wsUrl: envConfig.wsUrl,
    timeout: 30000,
    retryAttempts: 3,
  },
  
  // WebRTC configuration
  webrtc: {
    iceServers: envConfig.iceServers,
    turnServerUrl: envConfig.turnServerUrl,
    turnUsername: envConfig.turnUsername,
    turnCredential: envConfig.turnCredential,
  },
  
  // Feature flags
  features: {
    enableScreenShare: envConfig.enableScreenShare,
    enableChat: envConfig.enableChat,
    enableRecording: envConfig.enableRecording,
    enableVirtualBackground: envConfig.enableVirtualBackground,
  },
  
  // UI configuration
  ui: {
    maxVideoParticipants: envConfig.maxVideoParticipants,
    defaultVideoQuality: envConfig.defaultVideoQuality,
  },
};

export default config; 