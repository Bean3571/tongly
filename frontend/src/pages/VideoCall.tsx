import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVideoCall } from '../contexts/VideoCallContext';
import { VideoPlayer } from '../components/VideoPlayer';
import { VideoCallControls } from '../components/VideoCallControls';
import { ParticipantTile } from '../components/ParticipantTile';

const VideoCall: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    stream, 
    screenStream, 
    peers, 
    shareScreen, 
    roomId, 
    setRoomId, 
    screenSharingId,
    leaveRoom,
    initializeConnections,
    isInitialized,
    isConnecting,
    connectionError
  } = useVideoCall();
  const [isCopied, setIsCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<Array<{ author: string, content: string }>>([]);
  const [messageInput, setMessageInput] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Initialize connections when component mounts
  useEffect(() => {
    console.log("VideoCall component mounted, initializing connections...");
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
      navigate("/video-call");
    }
  };

  useEffect(() => {
    if (id && isInitialized) {
      setRoomId(id);
    }
  }, [id, setRoomId, isInitialized]);

  // Handle back navigation and page refreshes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const copyRoomLink = () => {
    const url = `${window.location.origin}/video/${roomId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleLeaveCall = () => {
    leaveRoom();
  };

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      // Send message to peers - this would normally integrate with your socket system
      const newMessage = { author: 'You', content: messageInput };
      setChatMessages([...chatMessages, newMessage]);
      setMessageInput('');
    }
  };

  // Get the main video stream to display (screen share or active speaker)
  const screenSharingVideo = 
    screenSharingId ? 
      (screenSharingId === 'me' ? screenStream : peers[screenSharingId]?.stream) : 
      undefined;

  // Filter out the participant who is screen sharing from the participants grid
  const filteredPeers = { ...peers };
  if (screenSharingId && screenSharingId !== 'me') {
    delete filteredPeers[screenSharingId];
  }

  // Count all participants including the current user
  const participantCount = Object.keys(peers).length + 1;

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-6 bg-surface rounded-lg shadow-lg max-w-md">
          <div className="text-text-primary text-2xl mb-4">
            Connecting to video call...
          </div>
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-secondary mb-4">
            This may take a few moments. Please wait.
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-6 bg-surface rounded-lg shadow-lg max-w-md">
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
            <button
              onClick={() => navigate('/video-call')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Back to Video Call Page
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
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-center p-6 bg-surface rounded-lg shadow-lg max-w-md">
          <div className="text-text-primary text-2xl mb-4">
            Initializing video...
          </div>
          <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-text-secondary">
            We're setting up your camera and microphone.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Room info bar */}
      <div className="bg-surface p-3 flex items-center justify-between">
        <div className="text-text-primary font-semibold">
          Video Call: {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm bg-primary bg-opacity-10 rounded px-3 py-1 text-text-primary">
            {roomId}
          </div>
          <button
            onClick={copyRoomLink}
            className="p-1 hover:bg-primary hover:bg-opacity-10 rounded"
            title="Copy room link"
          >
            {isCopied ? (
              <span className="text-green-500 text-sm">Copied!</span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={toggleChat}
            className="p-1 hover:bg-primary hover:bg-opacity-10 rounded"
            title={showChat ? "Hide chat" : "Show chat"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-text-primary" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video area */}
        <div className={`flex-1 flex flex-col ${showChat ? 'w-3/4' : 'w-full'}`}>
          {/* Main content / screen share */}
          <div className="flex-1 p-2 relative">
            {screenSharingVideo ? (
              <div className="w-full h-full rounded-lg overflow-hidden bg-surface-dark">
                <VideoPlayer stream={screenSharingVideo} isMirrored={false} />
              </div>
            ) : (
              <div className="grid gap-2 h-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(filteredPeers).map(([peerId, peer]) => (
                  <ParticipantTile
                    key={peerId}
                    stream={peer.stream}
                    name={peer.userName || 'Participant'}
                    isMirrored={false}
                    isSelf={false}
                  />
                ))}
              </div>
            )}
            
            {/* Self view in bottom right */}
            {stream && (
              <div className="absolute bottom-4 right-4 w-48 h-36 z-10">
                <ParticipantTile
                  stream={stream}
                  name="You"
                  isMirrored={true}
                  isSelf={true}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Chat sidebar */}
        {showChat && (
          <div className="w-1/4 bg-surface-dark border-l border-gray-700 flex flex-col h-full">
            <div className="p-3 border-b border-gray-700 font-medium text-text-primary">
              Chat
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  No messages yet
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg max-w-[80%] ${
                      msg.author === 'You' 
                        ? 'ml-auto bg-primary text-white' 
                        : 'bg-surface text-text-primary'
                    }`}
                  >
                    <div className="font-medium text-xs">{msg.author}</div>
                    <div>{msg.content}</div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="p-2 border-t border-gray-700 flex">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 bg-surface p-2 rounded-l text-text-primary focus:outline-none"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-primary text-white p-2 rounded-r"
                disabled={!messageInput.trim()}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                  />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Call controls */}
      <VideoCallControls
        onShareScreen={shareScreen}
        onLeaveCall={handleLeaveCall}
        isScreenSharing={screenSharingId === 'me'}
      />
    </div>
  );
};

export default VideoCall; 