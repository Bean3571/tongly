import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoControls from './video/VideoControls';
import NetworkStatus from './video/NetworkStatus';
import { envConfig } from '../config/env';

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
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<MediaStream | null>(null);
  
  const {
    error,
    isConnected,
    networkQuality,
    localStream,
    resetError
  } = useWebRTC({
    lessonId,
    userId,
    onTrack: (stream, peerId, isScreenShare) => {
      console.log(`Received ${isScreenShare ? 'screen share' : 'camera'} track from peer ${peerId}`);
      
      setPeerStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.set(peerId, { stream, isScreenShare });
        return newStreams;
      });
      
      // Automatically switch to screen share view when received
      if (isScreenShare) {
        setActiveView('remote-screen');
      }
    },
    onPeerDisconnect: (peerId) => {
      console.log(`Peer ${peerId} disconnected`);
      
      setPeerStreams(prev => {
        const newStreams = new Map(prev);
        newStreams.delete(peerId);
        return newStreams;
      });
      
      // Reset view if the active stream was from this peer
      if (activeView.startsWith('remote')) {
        setActiveView('local-camera');
      }
    }
  });

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set up remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && peerStreams.size > 0) {
      // Find the appropriate stream based on active view
      const isScreenShareView = activeView === 'remote-screen';
      
      // Find a stream that matches the current view preference
      // Using Array.from to avoid iteration issues with Map
      const peerStreamsArray = Array.from(peerStreams.entries());
      for (const [_, { stream, isScreenShare }] of peerStreamsArray) {
        if (isScreenShareView === isScreenShare) {
          remoteVideoRef.current.srcObject = stream;
          return;
        }
      }
      
      // If no matching stream found, use the first available
      const firstStream = peerStreams.values().next().value;
      if (firstStream) {
        remoteVideoRef.current.srcObject = firstStream.stream;
      }
    }
  }, [peerStreams, activeView]);

  const handleToggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenShareRef.current) {
          screenShareRef.current.getTracks().forEach(track => track.stop());
          screenShareRef.current = null;
        }
        setIsScreenSharing(false);
        setActiveView('remote-camera');
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false 
        });
        
        screenShareRef.current = screenStream;
        
        // Handle when user stops sharing via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          screenShareRef.current = null;
        };
        
        setIsScreenSharing(true);
        setActiveView('local-screen');
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleRetryConnection = () => {
    resetError();
    window.location.reload();
  };

  if (error) {
    return (
      <ErrorContainer>
        <h3>Connection Error</h3>
        <p>{error.message}</p>
        <button onClick={handleRetryConnection}>Retry Connection</button>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <VideoContainer>
        <MainVideo>
          {peerStreams.size > 0 ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false}
            />
          ) : (
            <EmptyState>
              <p>Waiting for other participants to join...</p>
            </EmptyState>
          )}
        </MainVideo>
        
        <SelfVideo>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          />
          {isVideoOff && <VideoOffOverlay>Camera Off</VideoOffOverlay>}
        </SelfVideo>
      </VideoContainer>
      
      <ControlsContainer>
        <NetworkStatus quality={networkQuality} />
        
        <VideoControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onToggleScreenShare={handleToggleScreenShare}
          isScreenShareEnabled={envConfig.enableScreenShare}
        />
      </ControlsContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1a1a1a;
  color: white;
`;

const VideoContainer = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const MainVideo = styled.div`
  flex: 1;
  background-color: #000;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const SelfVideo = styled.div`
  position: absolute;
  width: 180px;
  height: 120px;
  bottom: 20px;
  right: 20px;
  border: 2px solid white;
  border-radius: 8px;
  overflow: hidden;
  background-color: #333;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const VideoOffOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  font-size: 14px;
`;

const ControlsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #2a2a2a;
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: #333;
  
  p {
    font-size: 18px;
    color: #ccc;
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background-color: #2a2a2a;
  
  h3 {
    color: #ff5555;
    margin-bottom: 10px;
  }
  
  p {
    color: #ddd;
    margin-bottom: 20px;
    text-align: center;
  }
  
  button {
    padding: 10px 20px;
    background-color: #4a4a4a;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    
    &:hover {
      background-color: #5a5a5a;
    }
  }
`;

export default VideoRoom; 