import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCConfig, NetworkQuality, SignalingMessage } from '../types/webrtc';
import { envConfig } from '../config/env';
import { api } from '../utils/api';

interface UseWebRTCProps {
  lessonId: number;
  userId: number;
  onTrack?: (stream: MediaStream, peerId: number, isScreenShare: boolean) => void;
  onPeerDisconnect?: (peerId: number) => void;
}

export const useWebRTC = ({ lessonId, userId, onTrack, onPeerDisconnect }: UseWebRTCProps) => {
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const configuration: RTCConfiguration = {
    iceServers: envConfig.iceServers,
  };

  // Reset any error state
  const resetError = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  const connectWebSocket = async () => {
    try {
      resetError();
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Try to refresh the token before establishing WebSocket connection
      try {
        const response = await api.post('/auth/refresh');
        const { token: newToken } = response.data;
        if (newToken) {
          localStorage.setItem('token', newToken);
        }
      } catch (error) {
        console.error('Failed to refresh token before WebSocket connection:', error);
        // Continue with existing token
      }

      // Normalize WebSocket URL
      let wsUrl = envConfig.wsUrl;
      
      // Convert HTTP URL to WebSocket URL if needed
      if (wsUrl.startsWith('http://')) {
        wsUrl = wsUrl.replace('http://', 'ws://');
      } else if (wsUrl.startsWith('https://')) {
        wsUrl = wsUrl.replace('https://', 'wss://');
      }
      
      // Remove trailing slash if present
      if (wsUrl.endsWith('/')) {
        wsUrl = wsUrl.slice(0, -1);
      }
      
      // Ensure the URL has the proper format
      const wsEndpoint = `${wsUrl}/lessons/${lessonId}/rtc?token=${localStorage.getItem('token')}`;
      
      console.log('Connecting to WebSocket endpoint:', wsEndpoint);
      
      const ws = new WebSocket(wsEndpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        ws.send(JSON.stringify({ type: 'get-peers' }));
      };

      ws.onmessage = async (event) => {
        console.log('WebSocket message received:', event.data);
        try {
          const message: SignalingMessage = JSON.parse(event.data);
          handleSignalingMessage(message);
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onclose = async (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // If connection was closed due to authentication (code 4001)
        if (event.code === 4001) {
          try {
            // Try to refresh the token
            const response = await api.post('/auth/refresh');
            const { token: newToken } = response.data;
            if (newToken) {
              localStorage.setItem('token', newToken);
              // Attempt to reconnect with new token
              if (reconnectAttempts.current < maxReconnectAttempts) {
                reconnectAttempts.current++;
                setTimeout(connectWebSocket, 1000 * reconnectAttempts.current);
                return;
              }
            }
          } catch (error) {
            console.error('Failed to refresh token after WebSocket close:', error);
          }
        } else if (event.code !== 1000 && event.code !== 1001) {
          // If not a normal closure, try to reconnect
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            setTimeout(connectWebSocket, 1000 * reconnectAttempts.current);
            return;
          }
        }
        
        cleanup();
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError(new Error('Failed to establish WebRTC connection'));
      };

    } catch (err) {
      console.error('Error in connectWebSocket:', err);
      setError(err instanceof Error ? err : new Error('Failed to initialize WebRTC'));
    }
  };

  useEffect(() => {
    const connect = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        await connectWebSocket();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize WebRTC'));
      }
    };

    connect();

    return () => cleanup();
  }, [lessonId, userId]);

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleSignalingMessage = async (message: SignalingMessage) => {
    try {
      switch (message.type) {
        case 'peers':
          const peerIds = JSON.parse(message.payload);
          peerIds.forEach((peerId: number) => createPeerConnection(peerId, true));
          break;

        case 'offer':
          const pc = peerConnections.current.get(message.from!) || 
            createPeerConnection(message.from!, false);
          await pc.setRemoteDescription(JSON.parse(message.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsRef.current?.send(JSON.stringify({
            type: 'answer',
            to: message.from,
            payload: JSON.stringify(answer),
          }));
          break;

        case 'answer':
          const peerConnection = peerConnections.current.get(message.from!);
          if (peerConnection) {
            await peerConnection.setRemoteDescription(JSON.parse(message.payload));
          }
          break;

        case 'ice-candidate':
          const peer = peerConnections.current.get(message.from!);
          if (peer) {
            await peer.addIceCandidate(JSON.parse(message.payload));
          }
          break;
      }
    } catch (error) {
      console.error('Signaling error:', error);
      setError(error instanceof Error ? error : new Error('Connection error occurred'));
    }
  };

  const createPeerConnection = (peerId: number, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(configuration);
    
    if (localStreamRef.current) {
      const stream = localStreamRef.current;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          to: peerId,
          payload: JSON.stringify(candidate),
        }));
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream && onTrack) {
        const isScreenShare = event.track.kind === 'video' && 
          event.track.label.toLowerCase().includes('screen');
        onTrack(stream, peerId, isScreenShare);
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          setNetworkQuality('good');
          break;
        case 'disconnected':
        case 'failed':
          setNetworkQuality('poor');
          peerConnections.current.delete(peerId);
          onPeerDisconnect?.(peerId);
          break;
        case 'new':
        case 'connecting':
          setNetworkQuality('fair');
          break;
      }
    };

    peerConnections.current.set(peerId, pc);
    return pc;
  };

  return {
    error,
    isConnected,
    networkQuality,
    peerConnections: peerConnections.current,
    localStream: localStreamRef.current,
    reconnect: connectWebSocket,  // Export reconnect function
    resetError                    // Export resetError function
  };
}; 