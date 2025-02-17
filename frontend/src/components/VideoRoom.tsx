import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { useWebRTC } from '@/hooks/useWebRTC';
import { NetworkQuality } from '@/types/webrtc';

// Components
const VideoControls = React.lazy(() => import('./video/VideoControls'));
const StreamView = React.lazy(() => import('./video/StreamView'));
const NetworkStatus = React.lazy(() => import('./video/NetworkStatus'));

interface VideoRoomProps {
  lessonId: number;
  userId: number;
}

type StreamType = 'camera' | 'screen';
type ActiveView = 'remote-camera' | 'remote-screen' | 'local-camera' | 'local-screen';

interface PeerStream {
  stream: MediaStream;
  isScreenShare: boolean;
}

const VideoRoom: React.FC<VideoRoomProps> = ({ lessonId, userId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('remote-camera');
  const [peerStreams, setPeerStreams] = useState<Map<number, PeerStream>>(new Map());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const handleTrack = useCallback((stream: MediaStream, peerId: number, isScreenShare: boolean) => {
    setPeerStreams(prev => {
      const updated = new Map(prev);
      updated.set(peerId, { stream, isScreenShare });
      return updated;
    });
  }, []);

  const handlePeerDisconnect = useCallback((peerId: number) => {
    setPeerStreams(prev => {
      const updated = new Map(prev);
      updated.delete(peerId);
      return updated;
    });
  }, []);

  const { 
    localStream, 
    isConnected, 
    networkQuality, 
    error,
    peerConnections
  } = useWebRTC({ 
    lessonId, 
    userId, 
    onTrack: handleTrack, 
    onPeerDisconnect: handlePeerDisconnect 
  });

  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  }, [localStream, isMuted]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  }, [localStream, isVideoOff]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing && screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true 
      });
      
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      setActiveView('local-screen');

      // Add screen share track to all peer connections
      const tracks = screenStream.getTracks();
      Array.from(peerConnections.values()).forEach(pc => {
        tracks.forEach(track => pc.addTrack(track, screenStream));
      });
    } catch (error) {
      console.error('Error sharing screen:', error);
      setIsScreenSharing(false);
    }
  }, [isScreenSharing, peerConnections]);

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={() => window.location.reload()}>
          Retry Connection
        </RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <MainView>
        <React.Suspense fallback={<LoadingSpinner />}>
          <StreamView
            localStream={localStream}
            localVideoRef={localVideoRef}
            peerStreams={peerStreams}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </React.Suspense>
      </MainView>

      <ControlsWrapper>
        <React.Suspense fallback={<LoadingSpinner />}>
          <VideoControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={isScreenSharing}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={toggleScreenShare}
          />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <NetworkStatus quality={networkQuality} />
        </React.Suspense>
      </ControlsWrapper>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-dark);
  color: var(--text-primary);
`;

const MainView = styled.div`
  flex: 1;
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
`;

const ControlsWrapper = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
`;

const ErrorMessage = styled.div`
  color: var(--error);
  font-size: 1.1rem;
`;

const RetryButton = styled.button`
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: var(--primary-dark);
  }
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

export default VideoRoom; 