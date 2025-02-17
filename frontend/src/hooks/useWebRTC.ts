import { useEffect, useRef, useState } from 'react';
import { WebRTCConfig, NetworkQuality, SignalingMessage } from '@/types/webrtc';
import { getEnvConfig } from '@/env';

interface UseWebRTCProps {
  lessonId: number;
  userId: number;
  onTrack?: (stream: MediaStream, peerId: number, isScreenShare: boolean) => void;
  onPeerDisconnect?: (peerId: number) => void;
}

export const useWebRTC = ({ lessonId, userId, onTrack, onPeerDisconnect }: UseWebRTCProps) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('good');
  const [error, setError] = useState<string | null>(null);

  const peerConnections = useRef<Map<number, RTCPeerConnection>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  const config = getEnvConfig();
  const configuration: RTCConfiguration = {
    iceServers: config.iceServers,
  };

  const initializeMedia = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: config.defaultVideoQuality === '720p' ? 1280 : 1920 },
          height: { ideal: config.defaultVideoQuality === '720p' ? 720 : 1080 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (error) {
      setError('Failed to access media devices');
      throw error;
    }
  };

  const connectToSignalingServer = () => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`${config.wsUrl}/api/lessons/${lessonId}/rtc?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'get-peers' }));
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Implement reconnection logic with exponential backoff
      setTimeout(connectToSignalingServer, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error occurred');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleSignalingMessage(message);
    };

    return ws;
  };

  const createPeerConnection = (peerId: number, isInitiator: boolean) => {
    const pc = new RTCPeerConnection(configuration);
    
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
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
      setError('Connection error occurred');
    }
  };

  const cleanup = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    wsRef.current?.close();
  };

  useEffect(() => {
    (async () => {
      try {
        await initializeMedia();
        connectToSignalingServer();
      } catch (error) {
        console.error('Setup error:', error);
      }
    })();

    return cleanup;
  }, [lessonId]);

  return {
    localStream,
    isConnected,
    networkQuality,
    error,
    peerConnections: peerConnections.current,
  };
}; 