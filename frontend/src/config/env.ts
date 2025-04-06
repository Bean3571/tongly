/**
 * Environment configuration with safe fallbacks
 * This file centralizes all environment variable access and provides defaults
 */

// Helper function to safely get environment variables with fallback values
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // First check runtime config (useful for production deployments)
  if (
    typeof window !== 'undefined' &&
    window.__RUNTIME_CONFIG__ && 
    window.__RUNTIME_CONFIG__[key]
  ) {
    return window.__RUNTIME_CONFIG__[key];
  }
  
  // Then try standard Vite env variables
  try {
    // Using process.env for Create React App environment
    if (typeof process !== 'undefined' && process.env && process.env[`REACT_APP_${key}`]) {
      const envValue = process.env[`REACT_APP_${key}`];
      return envValue !== undefined ? String(envValue) : defaultValue;
    }
    return defaultValue;
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

// Environment configuration with default values
export const envConfig = {
  // API Configuration
  apiUrl: getEnvVar('API_URL', 'http://192.168.0.106:8080'),
  wsUrl: getEnvVar('WS_URL', 'ws://192.168.0.106:8080'),
  environment: getEnvVar('ENVIRONMENT', 'development'),
  
  // WebRTC Configuration
  iceServers: parseJSON<Array<{ urls: string }>>(
    getEnvVar('ICE_SERVERS'), 
    [{ urls: 'stun:stun.l.google.com:19302' }]
  ),
  turnServerUrl: getEnvVar('TURN_SERVER_URL', ''),
  turnUsername: getEnvVar('TURN_USERNAME', ''),
  turnCredential: getEnvVar('TURN_CREDENTIAL', ''),
  
  // Feature Flags
  enableScreenShare: parseBoolean(getEnvVar('ENABLE_SCREEN_SHARE', 'false')),
  enableChat: parseBoolean(getEnvVar('ENABLE_CHAT', 'true')),
  enableRecording: parseBoolean(getEnvVar('ENABLE_RECORDING', 'false')),
  
  // UI Configuration
  maxVideoParticipants: parseInt(getEnvVar('MAX_VIDEO_PARTICIPANTS', '4'), 10),
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