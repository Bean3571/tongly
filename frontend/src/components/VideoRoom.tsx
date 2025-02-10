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
}

interface NetworkStatusProps {
  quality: 'good' | 'fair' | 'poor';
}

const VideoRoom: React.FC<VideoRoomProps> = ({ lessonId, userId }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<number, PeerConnection>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'good' | 'fair' | 'poor'>('good');

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
    const ws = new WebSocket(`ws://${window.location.host}/api/lessons/${lessonId}/rtc`);
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
      setPeers(prev => {
        const updated = new Map(prev);
        const peer = updated.get(peerId);
        if (peer) {
          peer.stream = stream;
          updated.set(peerId, peer);
        }
        return updated;
      });
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

  return (
    <Container>
      <VideoGrid>
        <LocalVideoContainer>
          <VideoElement
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
          />
          <ParticipantName>You</ParticipantName>
          <NetworkStatus quality={networkQuality}>
            {networkQuality === 'good' ? '📶' : networkQuality === 'fair' ? '📡' : '⚠️'}
          </NetworkStatus>
        </LocalVideoContainer>
        {Array.from(peers.values()).map(peer => (
          <RemoteVideoContainer key={peer.id}>
            {peer.stream && (
              <>
                <VideoElement
                  ref={(el) => {
                    if (peerRefs.current[peer.id.toString()]) {
                      peerRefs.current[peer.id.toString()].video = el;
                    }
                  }}
                  autoPlay
                  playsInline
                />
                <ParticipantName>Participant {peer.id}</ParticipantName>
              </>
            )}
          </RemoteVideoContainer>
        ))}
      </VideoGrid>

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
  height: 100vh;
  background: #1a1a1a;
`;

const VideoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  padding: 1rem;
  flex: 1;
`;

const VideoContainer = styled.div`
  position: relative;
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
`;

const LocalVideoContainer = styled(VideoContainer)`
  border: 2px solid #4a90e2;
`;

const RemoteVideoContainer = styled(VideoContainer)``;

const VideoElement = styled.video`
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
`;

const ParticipantName = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem;
  border-radius: 4px;
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

const NetworkStatus = styled.div<NetworkStatusProps>`
  font-size: 1.5rem;
  color: ${(props: NetworkStatusProps) =>
    props.quality === 'good' ? '#4caf50' :
    props.quality === 'fair' ? '#ff9800' : '#f44336'
  };
`;

export default VideoRoom; 