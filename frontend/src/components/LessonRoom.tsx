import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLessonById } from '../services/lesson.service';
import { initializeVideoSession, logVideoCallEvent } from '../services/video_call.service';
import { Lesson, VideoCallEventType, VideoCallViewType } from '../types/lesson';
import { User } from '../types/user';
import styled from 'styled-components';
import { envConfig } from '../config/env';

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
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
  overflow: hidden;
  -webkit-transform: translateZ(0);
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #fff;
  border-top: 1px solid #eee;
`;

const ControlButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: ${props => props.$active ? '#FF6B00' : '#eee'};
  color: ${props => props.$active ? '#fff' : '#333'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$active ? '#e65c00' : '#ddd'};
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

// Add a new styled component for visual feedback
const VideoStatus = styled.div<{ $connected: boolean }>`
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  background-color: ${props => props.$connected ? 'rgba(0, 200, 0, 0.7)' : 'rgba(200, 0, 0, 0.7)'};
  color: white;
  font-size: 0.9rem;
  z-index: 10;
  transition: all 0.3s ease;
`;

interface LessonRoomProps {
  lesson: Lesson;
}

const LessonRoom: React.FC<LessonRoomProps> = ({ lesson }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [connectionIssue, setConnectionIssue] = useState<boolean>(false);
  
  // Video call state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [cameraEnabled, setCameraEnabled] = useState<boolean>(true);
  const [screenShareEnabled, setScreenShareEnabled] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<VideoCallViewType>(VideoCallViewType.PARTICIPANT_CAMERA);
  
  // Connection status indicators
  const [rtcConnected, setRtcConnected] = useState<boolean>(false);
  const [remoteStreamActive, setRemoteStreamActive] = useState<boolean>(false);
  
  // User media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  // Current user from local storage
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUser, setOtherUser] = useState<{ id: number; first_name: string; last_name: string } | null>(null);

  // Store WebSocket and message sending function reference
  const socketRef = useRef<WebSocket | null>(null);
  const sendSignalingMessageRef = useRef<(message: any) => void>(() => {});

  // Add connection recovery tracking
  const reconnectAttemptRef = useRef<number>(0);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add this at the top with other state variables
  const [renegotiationCount, setRenegotiationCount] = useState<number>(0);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Add browser detection at the top of the file, after imports
  // Browser detection utility
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = "unknown";
    let version = "unknown";
    
    // Detect Chrome
    if (/Chrome/.test(userAgent) && !/Chromium|Edge|Edg|OPR|Opera/.test(userAgent)) {
      browser = "Chrome";
      version = userAgent.match(/Chrome\/(\d+)/)?.[1] || "unknown";
    } 
    // Detect Firefox
    else if (/Firefox/.test(userAgent)) {
      browser = "Firefox";
      version = userAgent.match(/Firefox\/(\d+)/)?.[1] || "unknown";
    }
    // Detect Safari
    else if (/Safari/.test(userAgent) && !/Chrome|Chromium|Edge|Edg|OPR|Opera/.test(userAgent)) {
      browser = "Safari";
      version = userAgent.match(/Version\/(\d+)/)?.[1] || "unknown";
    }
    // Detect Edge
    else if (/Edge|Edg/.test(userAgent)) {
      browser = "Edge";
      version = userAgent.match(/Edge\/(\d+)|Edg\/(\d+)/)?.[1] || "unknown";
    }
    
    return { browser, version: Number(version) };
  };
  
  const browserInfo = getBrowserInfo();
  console.log("Browser detected:", browserInfo.browser, browserInfo.version);

  // Add a new Android detection function at the top where browser detection is
  const isAndroidDevice = () => {
    return /Android/.test(navigator.userAgent);
  };

  // Add direct Android WebRTC compatibility check
  const isAndroidWebRTCCompatible = () => {
    const ua = navigator.userAgent;
    // Detect Android Chrome version (most common Android browser)
    const chromeMatch = ua.match(/Chrome\/(\d+)/i);
    const isAndroid = /Android/.test(ua);
    
    if (isAndroid && chromeMatch) {
      const chromeVersion = parseInt(chromeMatch[1], 10);
      console.log("Android Chrome version detected:", chromeVersion);
      return chromeVersion >= 80; // Most versions 80+ support WebRTC well
    }
    
    return isAndroid; // Default to true for other Android browsers
  };

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
        
        // Request user media with more specific constraints
        const constraints = {
          audio: true,
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        };
        
        console.log("Requesting user media with constraints:", constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Log tracks from the stream
        stream.getTracks().forEach(track => {
          console.log(`Local ${track.kind} track:`, track);
          console.log(`Track settings:`, track.getSettings());
        });
        
        localStreamRef.current = stream;
        
        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          
          // Wait for video to be loaded
          localVideoRef.current.onloadedmetadata = () => {
            console.log("Local video metadata loaded");
            localVideoRef.current!.play()
              .then(() => console.log("Local video started playing"))
              .catch(err => console.error("Error playing local video:", err));
          };
        }
        
        // Initialize WebRTC peer connection
        setupPeerConnection();
        
        // Log join event
        logVideoCallEvent(lesson.id, VideoCallEventType.JOINED);
        
        // Periodically check remote video status
        const videoCheckInterval = setInterval(() => {
          checkRemoteVideoStatus();
        }, 5000);
        
        // Return cleanup function
        return () => {
          clearInterval(videoCheckInterval);
        };
      } catch (err: any) {
        console.error('Error accessing media devices:', err);
        setError(`Failed to access camera or microphone: ${err.message || 'Please check permissions'}`);
      }
    };
    
    const mediaDevicesPromise = setupMediaDevices();
    
    // Cleanup when component unmounts
    return () => {
      mediaDevicesPromise.then(cleanup => cleanup && cleanup());
      
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          console.log(`Stopping local ${track.kind} track`);
          track.stop();
        });
        localStreamRef.current = null;
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          console.log(`Stopping screen ${track.kind} track`);
          track.stop();
        });
        screenStreamRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        console.log("Closing peer connection");
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Log left event
      logVideoCallEvent(lesson.id, VideoCallEventType.LEFT);
    };
  }, [sessionId, token, lesson]);

  // Function to check remote video status with better error recovery
  const checkRemoteVideoStatus = () => {
    if (!remoteVideoRef.current) return;
    
    const videoElement = remoteVideoRef.current;
    const stream = videoElement.srcObject as MediaStream | null;
    
    console.log("Checking remote video status");
    console.log("- Remote video paused:", videoElement.paused);
    console.log("- Remote video readyState:", videoElement.readyState);
    console.log("- Remote video size:", videoElement.videoWidth, "x", videoElement.videoHeight);
    
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      console.log("- Remote video tracks:", videoTracks.length);
      
      videoTracks.forEach((track, index) => {
        console.log(`- Remote video track ${index}:`, track);
        console.log(`- Track enabled:`, track.enabled);
        console.log(`- Track readyState:`, track.readyState);
        console.log(`- Track muted:`, track.muted);
        console.log(`- Track settings:`, track.getSettings());
      });
      
      // Check if we have real video content
      const hasVideoContent = videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
      
      // Update remote stream active state based on actual video dimensions
      setRemoteStreamActive(videoTracks.length > 0 && 
        videoTracks[0].enabled && 
        videoTracks[0].readyState === 'live' &&
        hasVideoContent);
      
      // If video is playing but has zero dimensions, try applying CSS fix for mobile devices
      if ((!hasVideoContent || videoTracks[0].readyState !== 'live') && isAndroidDevice()) {
        console.log("Video issue detected on Android, applying special fixes");
        
        // Try refreshing the tracks on mobile
        if (peerConnectionRef.current) {
          const receivers = peerConnectionRef.current.getReceivers();
          const videoReceivers = receivers.filter(r => r.track && r.track.kind === 'video');
          
          if (videoReceivers.length > 0) {
            // Create a fresh stream with the receiver's track
            const freshStream = new MediaStream([videoReceivers[0].track]);
            
            // Add audio tracks if available
            const audioReceivers = receivers.filter(r => r.track && r.track.kind === 'audio');
            if (audioReceivers.length > 0) {
              freshStream.addTrack(audioReceivers[0].track);
            }
            
            // Set new stream and try to play
            videoElement.srcObject = freshStream;
            videoElement.play().catch(e => console.warn("Special mobile fix play failed:", e.message));
          }
        }
      }
    } else {
      console.log("- No media stream attached to remote video");
      setRemoteStreamActive(false);
      
      // If we have a peer connection but no stream, check receivers
      if (peerConnectionRef.current) {
        const receivers = peerConnectionRef.current.getReceivers();
        const videoReceivers = receivers.filter(r => r.track && r.track.kind === 'video');
        
        if (videoReceivers.length > 0) {
          console.log("Found video receivers but no stream attached, recreating stream");
          const receiverTrack = videoReceivers[0].track;
          
          if (receiverTrack.readyState === 'live') {
            // Create a new stream only if we don't already have one
            if (!videoElement.srcObject) {
              const remoteStream = new MediaStream([receiverTrack]);
              videoElement.srcObject = remoteStream;
              
              // Wait for metadata to load before playing
              videoElement.onloadedmetadata = () => {
                videoElement.play().catch(err => {
                  console.warn("Non-critical play error:", err.name);
                });
              };
            }
          }
        } else {
          console.warn("No video receivers found in peer connection");
        }
      }
    }
  };

  const setupPeerConnection = async () => {
    // Clear existing connection timeout if any
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    
    // Close any existing peer connection first
    if (peerConnectionRef.current) {
      console.log("Closing existing peer connection before creating a new one");
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Create STUN/TURN configuration with browser-specific adjustments
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Add additional STUN servers that might work better with mobile networks
        { urls: 'stun:openrelay.metered.ca:80' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ],
      iceCandidatePoolSize: 10,
      // Add these for better mobile compatibility
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    };
    
    // Safari-specific configurations
    if (browserInfo.browser === 'Safari') {
      configuration.iceTransportPolicy = 'all';
      // Safari needs specific RTCPeerConnection options
    }
    
    // Firefox-specific configurations
    if (browserInfo.browser === 'Firefox') {
      // Firefox handles ICE candidates differently
    }
    
    console.log("Creating peer connection with configuration:", configuration);
    const peerConnection = new RTCPeerConnection(configuration);
    peerConnectionRef.current = peerConnection;
    
    // Create a data channel for reliable connection with browser-specific options
    try {
      const dataChannelOptions: RTCDataChannelInit = {
        ordered: true,
      };
      
      // For Firefox, use different ordering guarantees
      if (browserInfo.browser === 'Firefox') {
        dataChannelOptions.ordered = true;
      }
      
      const dataChannel = peerConnection.createDataChannel('signaling', dataChannelOptions);
      dataChannelRef.current = dataChannel;
      
      dataChannel.onopen = () => {
        console.log("Data channel opened - connection fully established");
        
        // Try to send a ping over the data channel
        try {
          dataChannel.send(JSON.stringify({
            type: 'ping',
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error("Error sending over data channel:", e);
        }
      };
      
      dataChannel.onmessage = (event) => {
        console.log("Received data channel message:", event.data);
        
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ping') {
            // Send pong back
            dataChannel.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
              pingTimestamp: message.timestamp
            }));
          }
        } catch (e) {
          console.error("Error processing data channel message:", e);
        }
      };
      
      dataChannel.onerror = (error) => {
        console.error("Data channel error:", error);
      };
      
      dataChannel.onclose = () => {
        console.log("Data channel closed");
      };
    } catch (err) {
      console.error("Error creating data channel:", err);
    }

    // Log negotiation needed events
    peerConnection.onnegotiationneeded = async () => {
      console.log("Negotiation needed event triggered");
      
      // Only the tutor initiates offers on negotiationneeded
      if (currentUser?.id === lesson.tutor?.id) {
        try {
          console.log("Creating offer due to negotiation needed");
          await initiateCall();
        } catch (err) {
          console.error("Error handling negotiationneeded:", err);
        }
      } else {
        console.log("Negotiation needed but waiting for tutor to initiate");
      }
    };

    // Add local tracks to the connection
    if (localStreamRef.current) {
      console.log("Adding local tracks to peer connection");
      localStreamRef.current.getTracks().forEach(track => {
        if (localStreamRef.current) {
          console.log(`Adding ${track.kind} track to peer connection`);
          peerConnection.addTrack(track, localStreamRef.current);
        }
      });
    }

    // Modify the oniceconnectionstatechange function to handle connection loss
    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState;
      console.log("ICE connection state changed:", state);
      
      switch (state) {
        case 'checking':
          console.log("Connecting to peer...");
          setRtcConnected(false);
          break;
        case 'connected':
        case 'completed':
          console.log("Connection established with peer.");
          setRtcConnected(true);
          // Clear any connection-related errors
          if (connectionIssue) {
            setConnectionIssue(false);
            setError(null);
          }
          break;
        case 'failed':
          console.error("Connection failed.");
          setRtcConnected(false);
          
          // Restart ICE after failure if we have less than 3 renegotiation attempts
          if (renegotiationCount < 3) {
            console.log("ICE connection failed, initiating renegotiation:", renegotiationCount + 1);
            handleRenegotiation();
          } else {
            console.error("Max renegotiation attempts reached");
            // Show a more helpful error message
            setConnectionIssue(true);
            setError(
              <div>
                <p>Connection failed after multiple attempts.</p>
                <ErrorHelp>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                  <li>Make sure your firewall isn't blocking WebRTC connections</li>
                </ErrorHelp>
              </div>
            );
          }
          break;
        case 'disconnected':
          console.log("Peer disconnected.");
          setRtcConnected(false);
          
          // Try to recover from disconnected state after a short delay
          setTimeout(() => {
            if (peerConnectionRef.current && 
                peerConnectionRef.current.iceConnectionState === 'disconnected') {
              console.log("Still disconnected after timeout, attempting recovery");
              handleRenegotiation();
            }
          }, 2000);
          break;
        case 'closed':
          console.log("Connection closed.");
          setRtcConnected(false);
          break;
      }
    };

    // Add a function to handle renegotiation
    const handleRenegotiation = () => {
      if (!peerConnectionRef.current) return;
      
      setRenegotiationCount(prev => prev + 1);
      
      // If we're the tutor, initiate a new offer
      if (currentUser?.id === lesson.tutor?.id) {
        console.log("Initiating renegotiation as tutor");
        initiateCall();
      } else {
        console.log("Waiting for tutor to renegotiate");
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Generated ICE candidate:", event.candidate);
        // Send this candidate to the signaling server
        sendSignalingMessageRef.current({
          type: 'ice-candidate',
          candidate: event.candidate,
          sessionId,
          sender: currentUser?.id
        });
      } else {
        console.log("ICE candidate gathering complete");
      }
    };

    // Modify the ontrack handler with browser-specific tweaks
    peerConnection.ontrack = (event) => {
      console.log("Track received:", event.track.kind, event.track, "Browser:", browserInfo.browser);
      
      if (event.track.kind === 'video') {
        console.log("Received remote video track:", 
                    "enabled:", event.track.enabled, 
                    "muted:", event.track.muted, 
                    "readyState:", event.track.readyState);
        
        // Use a stable approach for handling the remote stream to prevent AbortError
        const remoteStream = event.streams[0] || new MediaStream();
        
        // If we received a track without a stream, add it to our remote stream
        if (!event.streams.length) {
          remoteStream.addTrack(event.track);
        }
        
        // Log more detailed information for debugging
        console.log("Remote stream tracks:", remoteStream.getTracks().map(t => `${t.kind}:${t.id}:${t.readyState}`));
        
        // Set the remote video source only if not already set with same track
        if (remoteVideoRef.current) {
          const currentStream = remoteVideoRef.current.srcObject as MediaStream | null;
          const currentTrackId = currentStream?.getVideoTracks()[0]?.id;
          
          // Only set if we have a different track to avoid AbortError
          if (currentTrackId !== event.track.id) {
            console.log("Setting new remote video track");
            
            // Create a fresh MediaStream for Chrome/Android compatibility
            const freshStream = new MediaStream();
            
            // Explicitly enable the track first
            event.track.enabled = true;
            freshStream.addTrack(event.track);
            
            // For audio tracks, check if they exist in the original stream and add them
            const audioTracks = event.streams[0]?.getAudioTracks() || [];
            audioTracks.forEach(audioTrack => {
              audioTrack.enabled = true; // Ensure audio is enabled too
              freshStream.addTrack(audioTrack);
            });
            
            // For Android, apply direct video source setting
            if (isAndroidDevice()) {
              console.log("Using direct track approach for Android");
              
              // Clean up any existing stream
              if (remoteVideoRef.current.srcObject) {
                const oldStream = remoteVideoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(track => track.stop());
              }
              
              // Apply the new stream
              remoteVideoRef.current.srcObject = null;
              setTimeout(() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = freshStream;
                }
              }, 10);
            } else {
              // For other browsers just set it directly
              remoteVideoRef.current.srcObject = freshStream;
            }
            
            // Force unmute
            remoteVideoRef.current.muted = false;
            
            // Handle metadata loading only once
            const metadataHandler = () => {
              console.log("Remote video metadata loaded");
              
              if (remoteVideoRef.current) {
                // For mobile browsers, especially Chrome on Android, we need special handling
                if (isAndroidDevice()) {
                  console.log("Android device detected, using special video handling");
                  // For Android, try to force video display with specific settings
                  remoteVideoRef.current.playbackRate = 1.0;
                  
                  // Force video element properties for Android
                  remoteVideoRef.current.style.transform = 'translateZ(0)';
                  remoteVideoRef.current.style.webkitTransform = 'translateZ(0)';
                }
                
                // Play with repeated attempts for mobile browsers
                const playVideo = () => {
                  if (remoteVideoRef.current) {
                    remoteVideoRef.current.play()
                      .then(() => {
                        console.log("Remote video playing successfully");
                        setRemoteStreamActive(true);
                      })
                      .catch(err => {
                        console.warn("Play error (non-critical):", err.name);
                        // Try again with timeout
                        setTimeout(() => {
                          if (remoteVideoRef.current) {
                            remoteVideoRef.current.play()
                              .then(() => setRemoteStreamActive(true))
                              .catch(e => console.warn("Second play attempt failed:", e.name));
                          }
                        }, 300);
                      });
                  }
                };
                
                // Try playing immediately
                playVideo();
                
                // And also after a short delay (helps with flaky Android WebRTC)
                setTimeout(playVideo, 1000);
              }
              
              // Remove the handler after first execution
              if (remoteVideoRef.current) {
                remoteVideoRef.current.onloadedmetadata = null;
              }
            };
            
            remoteVideoRef.current.onloadedmetadata = metadataHandler;
          } else {
            console.log("Remote track already set, skipping to prevent AbortError");
          }
        }
      } else if (event.track.kind === 'audio') {
        console.log("Received remote audio track");
        
        // Ensure the audio is added to the remote video's stream
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
          const stream = remoteVideoRef.current.srcObject as MediaStream;
          
          // Check if we already have this audio track
          const existingAudioTracks = stream.getAudioTracks();
          const trackExists = existingAudioTracks.some(t => t.id === event.track.id);
          
          // Only add if the track isn't already in the stream
          if (!trackExists) {
            stream.addTrack(event.track);
          }
        }
      }
    };

    // Setup a connection timeout to trigger reconnection
    connectionTimeoutRef.current = setTimeout(() => {
      if (peerConnectionRef.current && 
          (peerConnectionRef.current.iceConnectionState === 'failed' || 
           peerConnectionRef.current.iceConnectionState === 'disconnected')) {
        console.log("Connection timeout - attempting recovery");
        attemptConnectionRecovery();
      }
    }, 15000); // 15 seconds timeout

    // Setup WebSocket for signaling
    return setupSignaling();
  };

  // Function to attempt recovery of a failed connection
  const attemptConnectionRecovery = () => {
    if (reconnectAttemptRef.current >= 3) {
      console.log("Max reconnection attempts reached");
      setError(
        <div>
          <p>Failed to establish a reliable connection after multiple attempts.</p>
          <ErrorHelp>
            <li>Check your internet connection</li>
            <li>Make sure both participants have working cameras and microphones</li>
            <li>Try refreshing the page</li>
          </ErrorHelp>
        </div>
      );
      return;
    }

    reconnectAttemptRef.current++;
    console.log(`Attempting connection recovery (attempt ${reconnectAttemptRef.current})`);

    // Recreate the peer connection
    if (peerConnectionRef.current) {
      setupPeerConnection();
      
      // If we're the tutor, reinitiate the call after a short delay
      if (currentUser?.id === lesson.tutor?.id) {
        setTimeout(() => {
          console.log("Reinitiating call after recovery attempt");
          initiateCall();
        }, 2000);
      }
    }
  };

  // Add browser-specific handling to initiateCall function
  const initiateCall = async () => {
    if (!peerConnectionRef.current) return;
    
    try {
      console.log("Initiating call - creating offer", 
                 renegotiationCount > 0 ? `(renegotiation attempt ${renegotiationCount})` : '',
                 "Browser:", browserInfo.browser);
      
      // Create offer with browser-specific options
      const offerOptions: RTCOfferOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: renegotiationCount > 0,
      };
      
      // Firefox may need different options
      if (browserInfo.browser === 'Firefox') {
        // Firefox-specific adjustments if needed
      }
      
      const offer = await peerConnectionRef.current.createOffer(offerOptions);
      
      // Modify the SDP for better browser compatibility
      let sdp = offer.sdp;
      
      // Browser-specific SDP modifications
      if (sdp) {
        if (browserInfo.browser === 'Safari') {
          // Safari-specific SDP modifications
          console.log("Applying Safari-specific SDP modifications");
        } else if (browserInfo.browser === 'Firefox') {
          // Firefox-specific SDP modifications
          console.log("Applying Firefox-specific SDP modifications");
        }
      }
      
      const modifiedOffer = {
        type: offer.type, 
        sdp: sdp || offer.sdp
      } as RTCSessionDescriptionInit;
      
      await peerConnectionRef.current.setLocalDescription(modifiedOffer);
      console.log("Local description set");
      
      // Send the offer
      sendSignalingMessageRef.current({
        type: 'offer',
        offer: modifiedOffer,
        sessionId,
        sender: currentUser?.id,
        isReconnectAttempt: renegotiationCount > 0,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Error creating offer:", err);
      setError("Failed to initiate call. Please try refreshing the page.");
    }
  };

  // Setup WebSocket signaling
  const setupSignaling = () => {
    try {
      // Get base URL from environment config, ensuring it doesn't already include a protocol
      const baseWsUrl = envConfig.wsUrl.replace(/^(wss?|https?):\/\//, '');
      
      // Always use secure connection (WSS) for HTTPS pages
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${baseWsUrl}/api/ws/lessons/${lesson.id}/rtc?token=${token}`;
      
      console.log("Page loaded over:", window.location.protocol);
      console.log("Environment wsUrl:", envConfig.wsUrl);
      console.log("Attempting to connect to WebSocket:", wsUrl);
      
      // Create WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        
        // Special handling for local development mode
        if (window.location.hostname === 'localhost' && window.location.protocol === 'https:') {
          setError(
            <div>
              <p>Secure WebSocket (WSS) connection failed on localhost.</p>
              <ErrorHelp>
                <li>When running in development mode on HTTPS, your server must also support HTTPS/WSS</li>
                <li>For development, you can temporarily use HTTP instead of HTTPS:</li>
                <li style={{fontWeight: 'bold'}}>
                  Try running your React app with: <code>HTTPS=false npm start</code>
                </li>
                <li>
                  Or ensure your backend server has proper SSL certificate configuration
                </li>
              </ErrorHelp>
              <p className="mt-4">
                Current connection details:
                <br />
                Page protocol: {window.location.protocol}
                <br />
                WebSocket URL: {wsUrl}
              </p>
              <button 
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
                onClick={() => window.open('http://localhost:3000/lessons/' + lesson.id, '_self')}
              >
                Try HTTP Mode
              </button>
            </div>
          );
        } else {
          // Production mode error
          setError(
            <div>
              <p>WebSocket connection error.</p>
              <ErrorHelp>
                <li>Your page is loaded over {window.location.protocol}, so WebSocket must use {protocol}</li>
                <li>The backend server must be properly configured with SSL certificates</li>
                <li>Make sure the server is running and accessible</li>
                <li>Check for any network/firewall issues</li>
              </ErrorHelp>
              <p className="mt-4">
                Current connection details:
                <br />
                Page protocol: {window.location.protocol}
                <br />
                WebSocket URL: {wsUrl}
              </p>
            </div>
          );
        }
      };
      
      setupSocketEventHandlers(socket);
      
      // Cleanup function to close websocket connection
      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    } catch (err) {
      console.error("Error setting up WebSocket:", err);
      setError("Failed to setup WebSocket connection: " + (err instanceof Error ? err.message : String(err)));
      return () => {}; // Empty cleanup function
    }
  };
  
  // Helper function to set up socket event handlers
  const setupSocketEventHandlers = (socket: WebSocket) => {
    socket.onopen = () => {
      console.log("WebSocket connected for signaling");
      
      // Send a join message
      sendSignalingMessageRef.current({
        type: 'join',
        sessionId,
        sender: currentUser?.id
      });

      // After joining, initiate the call if we're the tutor
      if (currentUser?.id === lesson.tutor?.id) {
        initiateCall();
      }
    };
    
    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("Received signaling message:", message);
        
        switch (message.type) {
          case 'offer':
            if (peerConnectionRef.current && message.sender !== currentUser?.id) {
              console.log("Received offer from:", message.sender);
              console.log("Offer SDP:", message.offer.sdp);
              
              // Set remote description from offer
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.offer));
              console.log("Set remote description from offer");
              
              // Create answer with specific constraints
              const answerOptions = {
                voiceActivityDetection: true
              };
              
              const answer = await peerConnectionRef.current.createAnswer(answerOptions);
              console.log("Created answer SDP:", answer.sdp);
              
              await peerConnectionRef.current.setLocalDescription(answer);
              console.log("Local description (answer) set");
              
              // Send answer back
              sendSignalingMessageRef.current({
                type: 'answer',
                answer,
                sessionId,
                sender: currentUser?.id
              });
            }
            break;
            
          case 'answer':
            if (peerConnectionRef.current && message.sender !== currentUser?.id) {
              console.log("Received answer from:", message.sender);
              console.log("Answer SDP:", message.answer.sdp);
              
              console.log("Setting remote description from answer");
              try {
                await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(message.answer));
                console.log("Remote description set successfully");
              } catch (err) {
                console.error("Error setting remote description:", err);
              }
            }
            break;
            
          case 'ice-candidate':
            if (peerConnectionRef.current && message.sender !== currentUser?.id) {
              try {
                console.log("Received ICE candidate:", message.candidate);
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.candidate));
                console.log("Added ICE candidate successfully");
              } catch (err) {
                console.error("Error adding received ICE candidate:", err);
              }
            }
            break;
            
          case 'user-joined':
            console.log("User joined the call:", message.user);
            if (currentUser?.id === lesson.tutor?.id) {
              // If we're the tutor and someone just joined, initiate the call
              initiateCall();
            }
            break;
        }
      } catch (err) {
        console.error("Error processing signaling message:", err);
      }
    };
    
    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
    
    // Helper function to send signaling messages
    const sendSignalingMessage = (message: any) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.error("WebSocket not open, can't send message");
      }
    };
    
    // Store the sendSignalingMessage function in ref
    sendSignalingMessageRef.current = sendSignalingMessage;
    
    // Store the sendSignalingMessage function in window for debugging
    (window as any).sendSignalingMessage = sendSignalingMessage;
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
    
    console.log("Changing view to:", newView);
    
    // Update displayed video based on selected view
    if (remoteVideoRef.current) {
      switch (newView) {
        case VideoCallViewType.PARTICIPANT_CAMERA:
          // Show remote participant's camera with enhanced Android support
          if (peerConnectionRef.current) {
            const receivers = peerConnectionRef.current.getReceivers();
            console.log("Available receivers:", receivers);
            
            const videoReceivers = receivers.filter(
              receiver => receiver.track && receiver.track.kind === 'video'
            );
            
            if (videoReceivers.length > 0) {
              console.log("Found video receiver:", videoReceivers[0]);
              
              // Create a new stream to avoid stale references
              const freshStream = new MediaStream();
              freshStream.addTrack(videoReceivers[0].track);
              
              // Also add audio tracks if available
              const audioReceivers = receivers.filter(
                receiver => receiver.track && receiver.track.kind === 'audio'
              );
              
              if (audioReceivers.length > 0) {
                freshStream.addTrack(audioReceivers[0].track);
              }
              
              // Special Android handling - force track enable
              if (isAndroidDevice()) {
                console.log("Applying special Android video track handling");
                videoReceivers[0].track.enabled = true;
                
                // Try to force keyframe for Android
                try {
                  // This might help force a keyframe
                  const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
                  if (sender && sender.getParameters) {
                    const params = sender.getParameters();
                    if (params) sender.setParameters(params);
                  }
                } catch (e) {
                  console.warn("Error requesting keyframe:", e);
                }
              }
              
              // Clear and set new stream
              if (remoteVideoRef.current.srcObject) {
                const oldStream = remoteVideoRef.current.srcObject as MediaStream;
                oldStream.getTracks().forEach(track => {
                  oldStream.removeTrack(track);
                });
              }
              
              remoteVideoRef.current.srcObject = freshStream;
              console.log("Set remote video from receiver track");
              
              // More aggressive approach for playing video
              const forcePlay = () => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.muted = false;
                  remoteVideoRef.current.play()
                    .then(() => {
                      console.log("Video playing successfully after view change");
                      setRemoteStreamActive(true);
                    })
                    .catch(err => {
                      console.warn("Play error on view change:", err);
                      // Try one more time after a delay
                      setTimeout(() => {
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.play()
                            .catch(e => console.warn("Second play attempt failed:", e));
                        }
                      }, 500);
                    });
                }
              };
              
              // First try playing immediately
              forcePlay();
              
              // Then try again after a short delay (helps with Android)
              setTimeout(forcePlay, 1000);
            } else {
              console.warn("No video receivers found in peer connection");
            }
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

  // Handle video status change to manage "black screen" issue
  useEffect(() => {
    // Check video element size after stream is active
    if (remoteStreamActive && remoteVideoRef.current) {
      // Set a timeout to verify we actually have video content
      const verifyVideoContent = setTimeout(() => {
        if (remoteVideoRef.current) {
          const hasVideoContent = remoteVideoRef.current.videoWidth > 0 && 
                                 remoteVideoRef.current.videoHeight > 0;
          
          if (!hasVideoContent) {
            console.log("Video flagged as active but no content is visible");
            // Try to explicitly apply fixes
            if (remoteVideoRef.current.srcObject) {
              const stream = remoteVideoRef.current.srcObject as MediaStream;
              const videoTracks = stream.getVideoTracks();
              
              if (videoTracks.length > 0) {
                console.log("Attempting to fix black screen");
                
                // Request a key frame
                try {
                  const sender = peerConnectionRef.current?.getSenders().find(s => s.track?.kind === 'video');
                  if (sender) {
                    const params = sender.getParameters();
                    // This might help trigger a key frame
                    sender.setParameters(params);
                  }
                } catch (e) {
                  console.warn("Error requesting key frame:", e);
                }
              }
            }
          }
        }
      }, 3000);
      
      return () => clearTimeout(verifyVideoContent);
    }
  }, [remoteStreamActive]);

  // Add this effect to handle mobile device specifics
  useEffect(() => {
    // Special handling for mobile devices, especially Android
    if (isAndroidDevice() && remoteVideoRef.current) {
      console.log("Setting up special Android video handling");
      
      // For Android Chrome, we need to regularly check and potentially refresh the video
      const androidVideoChecker = setInterval(() => {
        if (remoteVideoRef.current) {
          const videoElement = remoteVideoRef.current;
          const stream = videoElement.srcObject as MediaStream | null;
          
          // Check if we need to recover the video (no stream or no video playing)
          const needsRecovery = !stream || 
                               !stream.getVideoTracks().length || 
                               videoElement.videoWidth === 0 || 
                               videoElement.videoHeight === 0;
                               
          if (needsRecovery) {
            console.log("Android: No video showing, attempting recovery");
            
            // Try to recover using existing peer connection receivers
            if (peerConnectionRef.current) {
              const receivers = peerConnectionRef.current.getReceivers();
              const videoReceivers = receivers.filter(r => r.track && r.track.kind === 'video');
              
              if (videoReceivers.length > 0 && videoReceivers[0].track.readyState === 'live') {
                console.log("Android: Found live video track, applying to video element");
                
                // Force track to be enabled
                videoReceivers[0].track.enabled = true;
                
                // Create fresh stream
                const freshStream = new MediaStream([videoReceivers[0].track]);
                
                // Add any audio tracks
                const audioReceivers = receivers.filter(r => r.track && r.track.kind === 'audio');
                if (audioReceivers.length > 0 && audioReceivers[0].track.readyState === 'live') {
                  audioReceivers[0].track.enabled = true;
                  freshStream.addTrack(audioReceivers[0].track);
                }
                
                // Apply more aggressive stream replacement for Android
                if (videoElement.srcObject) {
                  const oldStream = videoElement.srcObject as MediaStream;
                  oldStream.getTracks().forEach(track => track.stop());
                  videoElement.srcObject = null;
                }
                
                // Small delay before applying new stream (helps with Android)
                setTimeout(() => {
                  if (videoElement) {
                    videoElement.srcObject = freshStream;
                    videoElement.muted = false;
                    
                    // Force hardware acceleration directly on the element
                    videoElement.style.transform = 'translateZ(0)';
                    videoElement.style.webkitTransform = 'translateZ(0)';
                    
                    // Try to play
                    videoElement.play()
                      .then(() => console.log("Android recovery successful"))
                      .catch(e => console.warn("Android recovery play failed:", e));
                  }
                }, 50);
              }
            }
          }
        }
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(androidVideoChecker);
    }
  }, []);

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
            {error}
            <button 
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-md"
              onClick={() => navigate('/lessons')}
            >
              Return to Lessons
            </button>
          </ErrorMessage>
        ) : (
          <VideoContainer>
            <VideoElement 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              muted={false} 
              style={{ objectFit: 'contain' }}
              onError={(e) => console.error("Video element error:", e)}
            />
            <SelfVideo 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
            />
            
            {/* Connection status indicators */}
            <VideoStatus $connected={rtcConnected}>
              {rtcConnected ? 'Connected' : 'Connecting...'}
            </VideoStatus>
            
            {rtcConnected && !remoteStreamActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white text-xl">
                <div className="text-center p-4">
                  <div className="mb-2">Waiting for participant's camera...</div>
                  {renegotiationCount > 0 && (
                    <div className="text-sm mt-2">Connection recovery attempt: {renegotiationCount}/3</div>
                  )}
                  <div className="mt-4 text-sm">
                    <p>If the video remains black:</p>
                    <ul className="list-disc pl-5 mt-1 text-left">
                      <li>Make sure the other participant has enabled their camera</li>
                      <li>Try refreshing the page</li>
                      <li>Check if your browser supports WebRTC fully</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </VideoContainer>
        )}
      </MainContent>
      
      <ControlsBar>
        <ControlButton 
          $active={micEnabled} 
          onClick={toggleMicrophone}
          title={micEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {micEnabled ? "🎙️" : "🔇"}
        </ControlButton>
        
        <ControlButton 
          $active={cameraEnabled} 
          onClick={toggleCamera}
          title={cameraEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {cameraEnabled ? "📹" : "🚫"}
        </ControlButton>
        
        <ControlButton 
          $active={screenShareEnabled} 
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