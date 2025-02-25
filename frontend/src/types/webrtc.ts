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