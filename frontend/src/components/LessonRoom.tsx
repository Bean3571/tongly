import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById } from '../services/lesson.service';
import { initializeVideoSession, logVideoCallEvent } from '../services/video_call.service';
import { Lesson, VideoCallEventType, VideoCallViewType } from '../types/lesson';
import { User } from '../types/user';
import styled from 'styled-components';

// Styled Components
const LessonRoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fff;
  color: #333;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #fff;
  border-bottom: 1px solid #eee;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  color: #333;
`;

const ParticipantsInfo = styled.div`
  display: flex;
  gap: 1rem;
`;

const ParticipantName = styled.div`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #f9f9f9;
  border-radius: 20px;
  font-weight: 500;
`;

const MainContent = styled.main`
  display: flex;
  flex: 1;
  position: relative;
  background-color: #f9f9f9;
`;

const VideoContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #000;
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #eee;
`;

const ControlButton = styled.button<{ active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: ${props => props.active ? '#FF6B00' : '#eee'};
  color: ${props => props.active ? '#fff' : '#333'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#e65c00' : '#ddd'};
  }
`;

const ViewSelector = styled.select`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  border: 1px solid #ddd;
  background-color: #fff;
  color: #333;
  font-size: 0.9rem;
`;

const SelfVideo = styled.video`
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 240px;
  height: 180px;
  border-radius: 8px;
  border: 2px solid #fff;
  object-fit: cover;
  background-color: #000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  margin: 1rem;
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 4px;
  color: #d32f2f;
`;

const ErrorHelp = styled.ul`
  margin-top: 0.75rem;
  padding-left: 1.5rem;
  list-style-type: disc;
  
  li {
    margin-bottom: 0.5rem;
  }
`;

interface LessonRoomProps {
  lesson: Lesson;
}

const LessonRoom: React.FC<LessonRoomProps> = ({ lesson }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Video call state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<VideoCallViewType>(VideoCallViewType.PARTICIPANT_CAMERA);
  
  // User media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Current user from local storage
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: number; first_name: string; last_name: string } | null>(null);

  // Initialize the video session
  useEffect(() => {
    if (!lesson) return;

    const userJson = localStorage.getItem('user');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    }

    const initSession = async () => {
      try {
        setLoading(true);
        console.log("Initializing session for lesson:", lesson.id);
        const sessionResponse = await initializeVideoSession(lesson.id);
        console.log("Session response:", sessionResponse);
        setSessionId(sessionResponse.session_id);
        setToken(sessionResponse.token);

        // Determine the other participant
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          if (user.id === sessionResponse.student.id) {
            setOtherUser(sessionResponse.tutor);
          } else {
            setOtherUser(sessionResponse.student);
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize video session:', err);
        setError(`Failed to initialize video session: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [lesson]);

  // Set up WebRTC when session is ready
  useEffect(() => {
    if (!sessionId || !token || !lesson) return;

    const setupMediaDevices = async () => {
      try {
        console.log("Setting up media devices");
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Camera and microphone access is not supported in this browser or context. Please use a modern browser with HTTPS.');
          // Try to log the error event
          try {
            logVideoCallEvent(lesson.id, VideoCallEventType.JOINED, {
              error: true,
              message: 'MediaDevices API not available'
            });
          } catch (e) {
            console.error('Failed to log error event:', e);
          }
          return; // Exit early instead of throwing
        }
        
        // Request user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        
        localStreamRef.current = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Initialize WebRTC peer connection
        setupPeerConnection();
        
        // Log join event
        logVideoCallEvent(lesson.id, VideoCallEventType.JOINED);
      } catch (err: any) {
        console.error('Error accessing media devices:', err);
        setError(`Failed to access camera or microphone: ${err.message || 'Please check permissions'}`);
      }
    };
    
    setupMediaDevices();
    
    // Cleanup when component unmounts
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      
      // Log left event
      logVideoCallEvent(lesson.id, VideoCallEventType.LEFT);
    };
  }, [sessionId, token, lesson]);

  const setupPeerConnection = async () => {
    // WebRTC configuration
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    // Create peer connection
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;

    // Add local tracks to the connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, you would send this candidate to the other peer
        console.log('New ICE candidate:', event.candidate);
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      // Display remote stream
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Create and send offer (in a real implementation)
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // In a real implementation, you would send this offer to the other peer
      console.log('Created offer:', offer);
      
      // For testing, simulate receiving an answer
      setTimeout(async () => {
        // Create a proper answer SDP instead of reusing the offer
        if (offer.sdp) {
          const sdpLines = offer.sdp.split('\n');
          const answerSdp = sdpLines.map(line => {
            // Change setup:actpass to setup:active in the SDP
            if (line.includes('setup:actpass')) {
              return line.replace('setup:actpass', 'setup:active');
            }
            return line;
          }).join('\n');
          
          const fakeAnswer = {
            type: 'answer',
            sdp: answerSdp,
          } as RTCSessionDescriptionInit;
          
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(fakeAnswer);
          }
        }
      }, 1000);
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to establish connection with the other participant');
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      
      if (audioTracks.length > 0) {
        const enabled = !micEnabled;
        audioTracks.forEach(track => {
          track.enabled = enabled;
        });
        
        setMicEnabled(enabled);
        
        // Log event
        if (lesson) {
          logVideoCallEvent(lesson.id, VideoCallEventType.MIC_TOGGLED, { enabled });
        }
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      
      if (videoTracks.length > 0) {
        const enabled = !cameraEnabled;
        videoTracks.forEach(track => {
          track.enabled = enabled;
        });
        
        setCameraEnabled(enabled);
        
        // Log event
        if (lesson) {
          logVideoCallEvent(lesson.id, VideoCallEventType.CAMERA_TOGGLED, { enabled });
        }
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (screenShareEnabled) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        
        // Revert to camera
        if (localStreamRef.current && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        
        setScreenShareEnabled(false);
        
        // Log event
        if (lesson) {
          logVideoCallEvent(lesson.id, VideoCallEventType.SCREENSHARE_ENDED);
        }
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        
        screenStreamRef.current = stream;
        
        // Display screen share based on current view
        if (currentView === VideoCallViewType.MY_SCREEN) {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        }
        
        setScreenShareEnabled(true);
        
        // Stream ends when user stops sharing
        stream.getVideoTracks()[0].onended = () => {
          setScreenShareEnabled(false);
          if (lesson) {
            logVideoCallEvent(lesson.id, VideoCallEventType.SCREENSHARE_ENDED);
          }
        };
        
        // Log event
        if (lesson) {
          logVideoCallEvent(lesson.id, VideoCallEventType.SCREENSHARE_STARTED);
        }
      }
    } catch (err: any) {
      console.error('Error toggling screen share:', err);
      setError(`Failed to share screen: ${err.message || 'Please check permissions'}`);
    }
  };

  // Handle view change
  const handleViewChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newView = e.target.value as VideoCallViewType;
    setCurrentView(newView);
    
    // Update displayed video based on selected view
    if (remoteVideoRef.current) {
      switch (newView) {
        case VideoCallViewType.PARTICIPANT_CAMERA:
          // Show remote participant's camera
          if (peerConnectionRef.current) {
            const remoteTracks = peerConnectionRef.current.getReceivers().map(receiver => receiver.track);
            const remoteStream = new MediaStream(remoteTracks.filter(track => track !== null) as MediaStreamTrack[]);
            remoteVideoRef.current.srcObject = remoteStream;
          }
          break;
          
        case VideoCallViewType.PARTICIPANT_SCREEN:
          // Show remote participant's screen share (if available)
          // In a real implementation, you would have a separate track for this
          break;
          
        case VideoCallViewType.MY_SCREEN:
          // Show my screen share
          if (screenStreamRef.current) {
            remoteVideoRef.current.srcObject = screenStreamRef.current;
          }
          break;
      }
    }
    
    // Log event
    if (lesson) {
      logVideoCallEvent(lesson.id, VideoCallEventType.VIEW_CHANGED, { view: newView });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <LessonRoomContainer>
      <Header>
        <Title>Lesson Room: {lesson.language?.name}</Title>
        <ParticipantsInfo>
          {lesson.student && (
            <ParticipantName>
              Student: {lesson.student.first_name || lesson.student.username} {lesson.student.last_name || ''}
            </ParticipantName>
          )}
          {lesson.tutor && (
            <ParticipantName>
              Tutor: {lesson.tutor.first_name || lesson.tutor.username} {lesson.tutor.last_name || ''}
            </ParticipantName>
          )}
        </ParticipantsInfo>
      </Header>
      
      <MainContent>
        {error ? (
          <ErrorMessage>
            <p>{error}</p>
            <ErrorHelp>
              <li>Check your browser and device permissions.</li>
              <li>Ensure your microphone and camera are working properly.</li>
              <li>Try restarting your browser or device.</li>
            </ErrorHelp>
            <button 
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
              onClick={() => navigate('/lessons')}
            >
              Return to Lessons
            </button>
          </ErrorMessage>
        ) : (
          <VideoContainer>
            <VideoElement ref={remoteVideoRef} autoPlay playsInline />
            <SelfVideo ref={localVideoRef} autoPlay playsInline muted />
          </VideoContainer>
        )}
      </MainContent>
      
      <ControlsBar>
        <ControlButton 
          active={micEnabled} 
          onClick={toggleMicrophone}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {micEnabled ? "🎙️" : "🔇"}
        </ControlButton>
        
        <ControlButton 
          active={cameraEnabled} 
          onClick={toggleCamera}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? "📹" : "🚫"}
        </ControlButton>
        
        <ControlButton 
          active={screenShareEnabled} 
          onClick={toggleScreenShare}
          title={screenShareEnabled ? "Stop sharing screen" : "Share screen"}
        >
          {screenShareEnabled ? "🖥️" : "📊"}
        </ControlButton>
        
        <ViewSelector value={currentView} onChange={handleViewChange}>
          <option value={VideoCallViewType.PARTICIPANT_CAMERA}>Participant Camera</option>
          <option value={VideoCallViewType.PARTICIPANT_SCREEN}>Participant Screen</option>
          <option value={VideoCallViewType.MY_SCREEN}>My Screen</option>
        </ViewSelector>
        
        <ControlButton 
          onClick={() => navigate('/lessons')}
          title="Exit lesson"
        >
          ❌
        </ControlButton>
      </ControlsBar>
    </LessonRoomContainer>
  );
};

export default LessonRoom; 