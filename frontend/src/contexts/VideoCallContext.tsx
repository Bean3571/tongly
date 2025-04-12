import React, {
  createContext,
  useEffect,
  useState,
  useReducer,
  useContext,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import Peer from "peerjs";
import socketIOClient, { Socket } from "socket.io-client";
import { peersReducer, PeerState } from "../reducers/peerReducer";
import {
  addPeerStreamAction,
  addPeerNameAction,
  removePeerStreamAction,
  addAllPeersAction,
} from "../reducers/peerActions";
import { useAuth } from "./AuthContext";

// Server configuration
const SERVER_IP = process.env.REACT_APP_SERVER_IP || window.location.hostname;
const SOCKET_SERVER_PORT = Number(process.env.REACT_APP_SOCKET_PORT) || 8000;
const PEER_SERVER_PORT = Number(process.env.REACT_APP_PEER_PORT) || 9001;

// Socket server URL - Use HTTPS
const SOCKET_URL = `https://${SERVER_IP}:${SOCKET_SERVER_PORT}`;

// Peer server settings with secure flag for HTTPS
const PEER_CONFIG = {
  host: SERVER_IP,
  port: PEER_SERVER_PORT,
  path: "/",
  secure: true, // Enable HTTPS connection
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  },
  debug: 3 // Set to 3 for maximum debugging
};

// For debugging
console.log('Socket URL:', SOCKET_URL);
console.log('Peer server config:', PEER_CONFIG);

interface VideoCallContextValue {
  stream?: MediaStream;
  screenStream?: MediaStream;
  peers: PeerState;
  shareScreen: () => void;
  roomId: string;
  setRoomId: (id: string) => void;
  screenSharingId: string;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  initializeConnections: () => void;
  isInitialized: boolean;
  isConnecting: boolean;
  connectionError: string | null;
}

export const VideoCallContext = createContext<VideoCallContextValue>({
  peers: {},
  shareScreen: () => {},
  roomId: "",
  setRoomId: () => {},
  screenSharingId: "",
  createRoom: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  initializeConnections: () => {},
  isInitialized: false,
  isConnecting: false,
  connectionError: null,
});

// Define socket event types
interface RoomNotFoundEvent {
  roomId: string;
}

interface RoomErrorEvent {
  message: string;
}

export const VideoCallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [me, setMe] = useState<Peer | null>(null);
  const [stream, setStream] = useState<MediaStream | undefined>(undefined);
  const [screenStream, setScreenStream] = useState<MediaStream | undefined>(undefined);
  const [peers, dispatch] = useReducer(peersReducer, {});
  const [roomId, setRoomId] = useState<string>("");
  const [screenSharingId, setScreenSharingId] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Track connection attempts to prevent excessive retries
  const socketAttemptRef = useRef<number>(0);
  const peerAttemptRef = useRef<number>(0);
  const maxConnectionAttempts = 3;
  
  // Use refs for values that shouldn't trigger rerenders when changed
  const userIdRef = useRef<string>(user?.id?.toString() || Math.random().toString(36).substring(2, 15));
  const userNameRef = useRef<string>(user?.first_name || "Anonymous");
  const socketConnectionRef = useRef<Socket | null>(null);
  
  // Update refs when user changes
  useEffect(() => {
    if (user) {
      userIdRef.current = user.id?.toString() || userIdRef.current;
      userNameRef.current = user.first_name || userNameRef.current;
    }
  }, [user]);

  // Reset connection state
  const resetConnectionState = useCallback(() => {
    socketAttemptRef.current = 0;
    peerAttemptRef.current = 0;
    setConnectionError(null);
    
    // Clean up any existing connections
    if (socketConnectionRef.current) {
      socketConnectionRef.current.disconnect();
      socketConnectionRef.current = null;
    }
    
    if (me) {
      me.disconnect();
      setMe(null);
    }
  }, [me]);

  // Initialize socket connection and peer connection
  const initializeConnections = useCallback(() => {
    if (isInitialized || isConnecting) return;
    
    console.log("Initializing connections...");
    setIsConnecting(true);
    resetConnectionState();

    // Check if network is available
    if (!navigator.onLine) {
      setConnectionError("Network connection unavailable. Please check your internet connection.");
      setIsConnecting(false);
      return;
    }

    // Create socket connection
    try {
      if (!socketConnectionRef.current && socketAttemptRef.current < maxConnectionAttempts) {
        socketAttemptRef.current++;
        
        socketConnectionRef.current = socketIOClient(SOCKET_URL, {
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
          transports: ['websocket', 'polling']
        });

        // Set up socket event handlers
        socketConnectionRef.current.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          setConnectionError(`Socket connection error: ${error.message}`);
          
          if (socketAttemptRef.current >= maxConnectionAttempts) {
            console.error(`Maximum socket connection attempts (${maxConnectionAttempts}) reached.`);
          }
        });

        socketConnectionRef.current.on('connect_timeout', () => {
          console.error('Socket connection timeout');
          setConnectionError("Socket connection timeout");
        });

        socketConnectionRef.current.on('reconnect', (attemptNumber: number) => {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
          setConnectionError(null);
        });

        socketConnectionRef.current.on('reconnect_failed', () => {
          console.error('Socket reconnection failed');
          setConnectionError("Socket reconnection failed after multiple attempts");
        });

        socketConnectionRef.current.on('connect', () => {
          console.log('Socket connected successfully');
          setConnectionError(null);
        });

        socketConnectionRef.current.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            // If the server disconnected us, don't try to reconnect automatically
            setConnectionError("Disconnected by server");
          }
        });
      }
    } catch (error) {
      console.error("Error initializing socket connection:", error);
      setConnectionError(`Failed to initialize socket: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Get media access
    const getMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        setIsInitialized(true);
        setIsConnecting(false);
      } catch (error) {
        console.error("Error accessing media devices:", error);
        // Try to get only audio if video fails
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
          console.log('Using audio-only stream');
          setStream(audioOnlyStream);
          setIsInitialized(true);
          setIsConnecting(false);
        } catch (audioError) {
          console.error("Error accessing audio devices:", audioError);
          setConnectionError("Could not access camera or microphone. Please check permissions.");
          setIsConnecting(false);
        }
      }
    };
    
    getMedia();
  }, [isInitialized, isConnecting, resetConnectionState]);

  const createRoom = useCallback(() => {
    if (!socketConnectionRef.current) {
      setConnectionError("No socket connection available");
      return;
    }
    socketConnectionRef.current.emit("create-room");
  }, []);

  const joinRoom = useCallback((newRoomId: string) => {
    if (!stream || !socketConnectionRef.current) {
      setConnectionError("No media stream or socket connection available");
      return;
    }
    
    socketConnectionRef.current.emit("join-room", { 
      roomId: newRoomId, 
      peerId: userIdRef.current, 
      userName: userNameRef.current 
    });
    setRoomId(newRoomId);
    navigate(`/video/${newRoomId}`);
  }, [stream, navigate]);

  const leaveRoom = useCallback(() => {
    if (!socketConnectionRef.current) return;
    
    socketConnectionRef.current.emit("leave-room", { 
      roomId, 
      peerId: userIdRef.current 
    });
    setRoomId("");
    navigate("/video-call");
  }, [roomId, navigate]);

  const enterRoom = useCallback((newRoomId: string) => {
    navigate(`/video/${newRoomId}`);
  }, [navigate]);

  const getUsers = useCallback(({
    participants,
  }: {
    participants: Record<string, { peerId: string; userName: string }>;
  }) => {
    console.log({ participants });
    const newPeers: PeerState = {};
    
    // Process participants as an object instead of an array
    if (participants) {
      Object.entries(participants).forEach(([id, participant]) => {
        newPeers[id] = {
          userName: participant.userName,
          peerId: participant.peerId,
        };
      });
      dispatch(addAllPeersAction(newPeers));
    }
  }, []);

  const removePeer = useCallback((peerId: string) => {
    dispatch(removePeerStreamAction(peerId));
  }, []);

  const shareScreen = useCallback(async () => {
    if (screenSharingId) {
      screenStream?.getTracks().forEach((track) => track.stop());
      setScreenSharingId("");
      setScreenStream(undefined);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenStream(stream);
      setScreenSharingId(userIdRef.current);

      stream.getVideoTracks()[0].onended = () => {
        setScreenSharingId("");
        setScreenStream(undefined);
      };
    } catch (err) {
      console.error("Error: " + err);
      setConnectionError(`Screen sharing error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [screenSharingId, screenStream]);

  const nameChangedHandler = useCallback(({
    peerId,
    userName,
  }: {
    peerId: string;
    userName: string;
  }) => {
    dispatch(addPeerNameAction(peerId, userName));
  }, []);

  // Socket event setup - only run when initialized
  useEffect(() => {
    if (!socketConnectionRef.current || !isInitialized) return;
    
    socketConnectionRef.current.on("room-created", enterRoom);
    socketConnectionRef.current.on("get-users", getUsers);
    socketConnectionRef.current.on("user-disconnected", removePeer);
    socketConnectionRef.current.on("user-started-sharing", (peerId: string) => setScreenSharingId(peerId));
    socketConnectionRef.current.on("user-stopped-sharing", () => setScreenSharingId(""));
    socketConnectionRef.current.on("name-changed", nameChangedHandler);
    socketConnectionRef.current.on("room-not-found", ({ roomId }: RoomNotFoundEvent) => {
      alert(`Room ${roomId} not found!`);
      navigate("/video-call");
    });
    socketConnectionRef.current.on("room-error", ({ message }: RoomErrorEvent) => {
      alert(`Error: ${message}`);
      navigate("/video-call");
    });

    return () => {
      if (!socketConnectionRef.current) return;
      
      socketConnectionRef.current.off("room-created");
      socketConnectionRef.current.off("get-users");
      socketConnectionRef.current.off("user-disconnected");
      socketConnectionRef.current.off("user-started-sharing");
      socketConnectionRef.current.off("user-stopped-sharing");
      socketConnectionRef.current.off("user-joined");
      socketConnectionRef.current.off("name-changed");
      socketConnectionRef.current.off("room-not-found");
      socketConnectionRef.current.off("room-error");
    };
  }, [enterRoom, getUsers, nameChangedHandler, navigate, removePeer, isInitialized]);

  // Create peer connection when initialized and stream is available
  useEffect(() => {
    if (!isInitialized || !stream) return;
    
    // Create peer with a random id if user id is not available
    const connectPeer = () => {
      if (me) {
        console.log('Peer already exists');
        return;
      }

      // If we've exceeded max attempts, don't keep trying
      if (peerAttemptRef.current >= maxConnectionAttempts) {
        console.error(`Maximum peer connection attempts (${maxConnectionAttempts}) reached.`);
        setConnectionError(`Could not connect to peer server after ${maxConnectionAttempts} attempts.`);
        return;
      }
      
      peerAttemptRef.current++;
      console.log(`Peer connection attempt ${peerAttemptRef.current}/${maxConnectionAttempts}`);

      try {
        console.log('Creating new peer with ID:', userIdRef.current);
        const newPeer = new Peer(userIdRef.current, PEER_CONFIG);
        
        newPeer.on('open', (id) => {
          console.log('My peer ID is:', id);
          setMe(newPeer);
          setConnectionError(null);
          peerAttemptRef.current = 0; // Reset attempt counter on success
        });
        
        newPeer.on('error', (err) => {
          console.error('Peer error:', err);
          setConnectionError(`Peer connection error: ${err.type}`);
          
          // Try to reconnect on errors, but only if we haven't exceeded max attempts
          if (err.type === 'peer-unavailable') {
            console.log('Peer unavailable, not reconnecting');
            return;
          }
          
          if (peerAttemptRef.current < maxConnectionAttempts) {
            setTimeout(() => {
              console.log('Attempting to reconnect peer...');
              // Disconnect and try again
              newPeer.disconnect();
              setMe(null);
              connectPeer();
            }, 5000);
          }
        });
        
        newPeer.on('disconnected', () => {
          console.log('Peer disconnected');
          // Try to reconnect when disconnected, but only if we haven't exceeded max attempts
          if (peerAttemptRef.current < maxConnectionAttempts) {
            setTimeout(() => {
              console.log('Attempting to reconnect peer...');
              try {
                newPeer.reconnect();
              } catch (err) {
                console.error('Error reconnecting peer:', err);
                setMe(null);
                connectPeer();
              }
            }, 5000);
          }
        });
      } catch (err) {
        console.error('Error creating peer:', err);
        setConnectionError(`Failed to create peer: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    connectPeer();
    
    return () => {
      if (me) {
        console.log('Disconnecting peer');
        me.disconnect();
        setMe(null);
      }
    };
  }, [me, isInitialized, stream, maxConnectionAttempts]);

  // Handle room name change
  useEffect(() => {
    if (roomId && userIdRef.current && socketConnectionRef.current) {
      socketConnectionRef.current.emit("change-name", { 
        peerId: userIdRef.current, 
        userName: userNameRef.current, 
        roomId 
      });
    }
  }, [roomId]);

  // Handle screen sharing state
  useEffect(() => {
    if (roomId && socketConnectionRef.current) {
      if (screenSharingId) {
        socketConnectionRef.current.emit("start-sharing", { peerId: screenSharingId, roomId });
      } else {
        socketConnectionRef.current.emit("stop-sharing");
      }
    }
  }, [screenSharingId, roomId]);

  // Handle peer calls
  useEffect(() => {
    if (!me || !stream || !socketConnectionRef.current) return;
    
    const handleUserJoined = ({ peerId, userName: name }: { peerId: string; userName: string }) => {
      console.log("User joined:", peerId, name);
      try {
        const call = me.call(peerId, stream, {
          metadata: {
            userName: userNameRef.current,
          },
        });
        call.on("stream", (peerStream) => {
          console.log("Got stream from", peerId);
          dispatch(addPeerStreamAction(peerId, peerStream));
        });
        dispatch(addPeerNameAction(peerId, name));
      } catch (err) {
        console.error("Error calling peer:", err);
      }
    };
    
    const handleIncomingCall = (call: any) => {
      console.log("Incoming call from:", call.peer);
      try {
        const { userName } = call.metadata || { userName: "Unknown" };
        dispatch(addPeerNameAction(call.peer, userName));
        call.answer(stream);
        call.on("stream", (peerStream: MediaStream) => {
          console.log("Got stream in answer from", call.peer);
          dispatch(addPeerStreamAction(call.peer, peerStream));
        });
      } catch (err) {
        console.error("Error answering call:", err);
      }
    };

    socketConnectionRef.current.on("user-joined", handleUserJoined);
    me.on("call", handleIncomingCall);

    return () => {
      socketConnectionRef.current?.off("user-joined", handleUserJoined);
      me.off("call", handleIncomingCall);
    };
  }, [me, stream]);

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Clean up streams
      stream?.getTracks().forEach(track => track.stop());
      screenStream?.getTracks().forEach(track => track.stop());
      
      // Clean up socket connection
      if (socketConnectionRef.current) {
        socketConnectionRef.current.disconnect();
        socketConnectionRef.current = null;
      }
      
      // Clean up peer connection
      if (me) {
        me.disconnect();
        setMe(null);
      }
      
      setIsInitialized(false);
      setIsConnecting(false);
      setConnectionError(null);
      socketAttemptRef.current = 0;
      peerAttemptRef.current = 0;
    };
  }, [stream, screenStream, me]);

  return (
    <VideoCallContext.Provider
      value={{
        stream,
        screenStream,
        peers,
        shareScreen,
        roomId,
        setRoomId,
        screenSharingId,
        createRoom,
        joinRoom,
        leaveRoom,
        initializeConnections,
        isInitialized,
        isConnecting,
        connectionError,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => useContext(VideoCallContext); 