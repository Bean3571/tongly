import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

interface VideoRoomProps {
  lessonId: number;
  userId: number;
}

interface PeerConnection {
  id: number;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  screenStream?: MediaStream;
}

interface NetworkStatusProps {
  quality: 'good' | 'fair' | 'poor';
}

type StreamType = 'camera' | 'screen';
type ActiveView = 'remote-camera' | 'remote-screen' | 'local-camera' | 'local-screen';

const VideoRoom: React.FC<VideoRoomProps> = ({ lessonId, userId }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<number, PeerConnection>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [activeView, setActiveView] = useState<ActiveView>('remote-camera');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerRefs = useRef<{ [key: string]: { video: HTMLVideoElement | null, stream: MediaStream | null } }>({});

  // WebRTC configuration
  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      // Add TURN servers in production
    ],
  };

  useEffect(() => {
    initializeWebRTC();
    return () => cleanup();
  }, []);

  const initializeWebRTC = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Connect to signaling server
      connectSignalingServer();
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const connectSignalingServer = () => {
    const token = localStorage.getItem('token');
    const ws = new WebSocket(`ws://localhost:8080/api/lessons/${lessonId}/rtc?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to signaling server');
      // Request list of connected peers
      ws.send(JSON.stringify({ type: 'get-peers' }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      handleSignalingMessage(message);
    };

    ws.onclose = () => {
      console.log('Disconnected from signaling server');
    };
  };

  const handleSignalingMessage = async (message: any) => {
    switch (message.type) {
      case 'peers':
        // Initialize connections with existing peers
        const peerIds = JSON.parse(message.payload);
        peerIds.forEach((peerId: number) => createPeerConnection(peerId, true));
        break;

      case 'peer-joined':
        // Create connection with new peer
        createPeerConnection(message.from, false);
        break;

      case 'peer-left':
        // Remove peer connection
        removePeerConnection(message.from);
        break;

      case 'offer':
        handleOffer(message);
        break;

      case 'answer':
        handleAnswer(message);
        break;

      case 'ice-candidate':
        handleIceCandidate(message);
        break;
    }
  };

  const createPeerConnection = (peerId: number, isInitiator: boolean) => {
    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          to: peerId,
          payload: JSON.stringify(event.candidate),
        });
      }
    };

    // Handle incoming streams
    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        // Check if this is a screen share stream or camera stream
        const isScreenShare = stream.getTracks().some(track => track.label.toLowerCase().includes('screen'));
        
        setPeers(prev => {
          const updated = new Map(prev);
          const peer = updated.get(peerId) || { id: peerId, connection: peerConnection };
          
          if (isScreenShare) {
            peer.screenStream = stream;
          } else {
            peer.stream = stream;
          }
          
          updated.set(peerId, peer);
          return updated;
        });

        // Update video element directly if it's a camera stream
        if (!isScreenShare) {
          const peerRef = peerRefs.current[peerId.toString()];
          if (peerRef?.video) {
            peerRef.video.srcObject = stream;
          }
        }
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      const quality = getNetworkQuality(peerConnection);
      setNetworkQuality(quality);
    };

    // Store peer connection
    setPeers(prev => {
      const updated = new Map(prev);
      updated.set(peerId, { id: peerId, connection: peerConnection });
      return updated;
    });

    // If initiator, create and send offer
    if (isInitiator) {
      createAndSendOffer(peerConnection, peerId);
    }

    return peerConnection;
  };

  const createAndSendOffer = async (peerConnection: RTCPeerConnection, peerId: number) => {
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      sendSignal({
        type: 'offer',
        to: peerId,
        payload: JSON.stringify(offer),
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  };

  const handleOffer = async (message: any) => {
    const peerId = message.from;
    const peerConnection = peers.get(peerId)?.connection || createPeerConnection(peerId, false);
    
    try {
      await peerConnection.setRemoteDescription(JSON.parse(message.payload));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      sendSignal({
        type: 'answer',
        to: peerId,
        payload: JSON.stringify(answer),
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (message: any) => {
    const peerConnection = peers.get(message.from)?.connection;
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(JSON.parse(message.payload));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleIceCandidate = async (message: any) => {
    const peerConnection = peers.get(message.from)?.connection;
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(JSON.parse(message.payload));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  };

  const removePeerConnection = (peerId: number) => {
    const peer = peers.get(peerId);
    if (peer) {
      peer.connection.close();
      setPeers(prev => {
        const updated = new Map(prev);
        updated.delete(peerId);
        return updated;
      });
    }
  };

  const sendSignal = (signal: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(signal));
    }
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;

        // Replace video track in all peer connections
        peers.forEach(peer => {
          const sender = peer.connection
            .getSenders()
            .find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });

        setIsScreenSharing(true);
      } else {
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        // Restore camera video track
        if (localStream) {
          const videoTrack = localStream.getVideoTracks()[0];
          peers.forEach(peer => {
            const sender = peer.connection
              .getSenders()
              .find(s => s.track?.kind === 'video');
            if (sender && videoTrack) {
              sender.replaceTrack(videoTrack);
            }
          });
        }

        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const getNetworkQuality = (pc: RTCPeerConnection): 'good' | 'fair' | 'poor' => {
    const state = pc.connectionState;
    switch (state) {
      case 'connected':
        return 'good';
      case 'connecting':
        return 'fair';
      default:
        return 'poor';
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connections
    peers.forEach(peer => {
      peer.connection.close();
    });
    setPeers(new Map());

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    Object.entries(peerRefs.current).forEach(([peerId, peer]) => {
      if (peer.video && peer.stream) {
        peer.video.srcObject = peer.stream;
      }
    });
  }, [peerRefs.current]);

  const renderStreamSelector = () => (
    <StreamSelector>
      <StreamButton 
        active={activeView === 'remote-camera'} 
        onClick={() => setActiveView('remote-camera')}
      >
        Participant Camera
      </StreamButton>
      <StreamButton 
        active={activeView === 'remote-screen'} 
        onClick={() => setActiveView('remote-screen')}
        disabled={!Array.from(peers.values()).some(peer => peer.screenStream)}
      >
        Participant Screen
      </StreamButton>
      <StreamButton 
        active={activeView === 'local-camera'} 
        onClick={() => setActiveView('local-camera')}
      >
        My Camera
      </StreamButton>
      <StreamButton 
        active={activeView === 'local-screen'} 
        onClick={() => setActiveView('local-screen')}
        disabled={!isScreenSharing}
      >
        My Screen
      </StreamButton>
    </StreamSelector>
  );

  const renderMainStream = () => {
    switch (activeView) {
      case 'remote-camera':
        return Array.from(peers.values()).map(peer => (
          <MainVideoContainer key={peer.id}>
            {peer.stream ? (
              <>
                <VideoElement
                  ref={el => {
                    if (el && peer.stream) {
                      peerRefs.current[peer.id.toString()] = {
                        ...peerRefs.current[peer.id.toString()],
                        video: el,
                        stream: peer.stream
                      };
                      el.srcObject = peer.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
                <StreamTitle>Participant Camera</StreamTitle>
              </>
            ) : (
              <NoStreamMessage>Waiting for participant's camera...</NoStreamMessage>
            )}
          </MainVideoContainer>
        ));
      case 'remote-screen':
        return Array.from(peers.values()).map(peer => (
          <MainVideoContainer key={`${peer.id}-screen`}>
            {peer.screenStream ? (
              <>
                <VideoElement
                  ref={el => {
                    if (el && peer.screenStream) {
                      el.srcObject = peer.screenStream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
                <StreamTitle>Participant Screen</StreamTitle>
              </>
            ) : (
              <NoStreamMessage>No screen being shared</NoStreamMessage>
            )}
          </MainVideoContainer>
        ));
      case 'local-camera':
        return (
          <MainVideoContainer>
            <VideoElement
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
            />
            <StreamTitle>My Camera</StreamTitle>
          </MainVideoContainer>
        );
      case 'local-screen':
        return (
          <MainVideoContainer>
            {screenStreamRef.current && (
              <>
                <VideoElement
                  ref={el => {
                    if (el && screenStreamRef.current) {
                      el.srcObject = screenStreamRef.current;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                />
                <StreamTitle>My Screen</StreamTitle>
              </>
            )}
          </MainVideoContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <MainSection>
        {renderStreamSelector()}
        {renderMainStream()}
      </MainSection>

      <LocalPreview>
        <VideoElement
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
        />
        <StreamTitle>You</StreamTitle>
        <NetworkStatus $quality={networkQuality}>
          {networkQuality === 'good' ? '📶' : networkQuality === 'fair' ? '📡' : '⚠️'}
        </NetworkStatus>
      </LocalPreview>

      <Controls>
        <ControlButton onClick={toggleMute}>
          {isMuted ? '🔇' : '🎤'}
        </ControlButton>
        <ControlButton onClick={toggleVideo}>
          {isVideoOff ? '📵' : '📹'}
        </ControlButton>
        <ControlButton onClick={toggleScreenShare}>
          {isScreenSharing ? '🔄' : '💻'}
        </ControlButton>
      </Controls>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const MainSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
`;

const StreamSelector = styled.div`
  display: flex;
  gap: 1rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`;

const StreamButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: ${props => props.active ? '#4a90e2' : 'rgba(255, 255, 255, 0.1)'};
  color: white;
  cursor: pointer;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#357abd' : 'rgba(255, 255, 255, 0.2)'};
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const MainVideoContainer = styled.div`
  position: relative;
  flex: 1;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16/9;
`;

const LocalPreview = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 240px;
  aspect-ratio: 16/9;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #4a90e2;
  z-index: 10;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StreamTitle = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const Controls = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
`;

const ControlButton = styled.button`
  background: #4a90e2;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #357abd;
  }
`;

const NetworkStatus = styled.div<{ $quality: 'good' | 'fair' | 'poor' }>`
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 1.2rem;
  padding: 0.3rem;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: ${(props) =>
    props.$quality === 'good' ? '#4caf50' :
    props.$quality === 'fair' ? '#ff9800' : '#f44336'
  };
`;

const NoStreamMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
`;

export default VideoRoom; 