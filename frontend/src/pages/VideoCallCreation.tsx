import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoCall } from '../contexts/VideoCallContext';

const VideoCallCreation: React.FC = () => {
  const navigate = useNavigate();
  const { 
    createRoom, 
    joinRoom, 
    stream, 
    initializeConnections, 
    isInitialized,
    isConnecting,
    connectionError
  } = useVideoCall();
  const [roomId, setRoomId] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 3;

  // Initialize connections when component mounts
  useEffect(() => {
    console.log("VideoCallCreation component mounted, initializing connections...");
    initializeConnections();
  }, [initializeConnections]);

  // Handle retry logic
  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
      initializeConnections();
    } else {
      alert("Maximum retry attempts reached. Please check your connection and try again later.");
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;

      // Apply camera and mic settings
      stream.getVideoTracks().forEach(track => {
        track.enabled = isCameraOn;
      });
      
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMicOn;
      });
    }
  }, [stream, isCameraOn, isMicOn]);

  const handleCreateRoom = () => {
    createRoom();
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      joinRoom(roomId);
    }
  };

  const toggleCamera = () => {
    if (stream) {
      const newState = !isCameraOn;
      stream.getVideoTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsCameraOn(newState);
    }
  };

  const toggleMic = () => {
    if (stream) {
      const newState = !isMicOn;
      stream.getAudioTracks().forEach(track => {
        track.enabled = newState;
      });
      setIsMicOn(newState);
    }
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-text-primary text-2xl mb-4">
            Initializing video call...
          </div>
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-secondary mb-4">
            Setting up your camera and microphone. This may take a few moments.
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-2xl mb-4">
            Connection Error
          </div>
          <div className="text-text-primary mb-6">
            {connectionError}
          </div>
          <div className="flex space-x-4 justify-center">
            <button
              onClick={handleRetry}
              disabled={retryCount >= maxRetries}
              className={`px-4 py-2 rounded ${
                retryCount >= maxRetries 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary-dark'
              } text-white`}
            >
              Retry Connection
            </button>
          </div>
          {retryCount > 0 && (
            <div className="mt-4 text-text-secondary">
              Retry attempt {retryCount}/{maxRetries}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isInitialized || !stream) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-text-primary text-2xl mb-4">
            Setting up video...
          </div>
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-secondary">
            Please wait while we initialize your camera and microphone.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto p-6 bg-surface shadow-md rounded-lg">
      <h1 className="text-3xl font-bold mb-8 text-text-primary">Video Call</h1>
      
      <div className="w-full flex flex-col md:flex-row gap-8 mb-8">
        {/* Preview your camera */}
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-text-primary">Camera Preview</h2>
          <div className="relative bg-black w-full aspect-video rounded-lg overflow-hidden">
            {stream ? (
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-secondary">
                Loading camera...
              </div>
            )}
            
            {/* Camera/mic controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full ${
                  isCameraOn ? 'bg-primary' : 'bg-red-500'
                }`}
                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isCameraOn ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18"
                    />
                  )}
                </svg>
              </button>
              
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full ${
                  isMicOn ? 'bg-primary' : 'bg-red-500'
                }`}
                aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMicOn ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM3 3l18 18"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Start or join call options */}
        <div className="flex-1">
          <div className="space-y-6">
            {/* Create room option */}
            <div className="p-6 border border-border rounded-lg hover:border-primary transition-colors">
              <h3 className="text-lg font-medium mb-3 text-text-primary">Start a new meeting</h3>
              <p className="text-text-secondary mb-4">
                Create a new video call room and share the link with others to join.
              </p>
              <button
                onClick={handleCreateRoom}
                className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                disabled={!stream}
              >
                Create new room
              </button>
            </div>
            
            {/* Join room option */}
            <div className="p-6 border border-border rounded-lg hover:border-primary transition-colors">
              <h3 className="text-lg font-medium mb-3 text-text-primary">Join a meeting</h3>
              <p className="text-text-secondary mb-4">
                Enter a room ID to join an existing video call.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="flex-1 py-3 px-4 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleJoinRoom}
                  className="py-3 px-6 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  disabled={!roomId.trim() || !stream}
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallCreation; 