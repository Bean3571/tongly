import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { getLessonById } from '../services/lesson.service';
import { joinRoom, getRoomWebsocketUrl, getRoomChatWebsocketUrl } from '../services/videoRoom.service';
import { Lesson } from '../types/lesson';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const LessonRoom: React.FC = () => {
  const { t } = useTranslation();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<{ text: string; time: string; isSelf: boolean }[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [chatVisible, setChatVisible] = useState<boolean>(true);
  const [newMessageAlert, setNewMessageAlert] = useState<boolean>(false);
  
  // Refs for WebRTC connection
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoContainer = useRef<HTMLDivElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const chatWebsocket = useRef<WebSocket | null>(null);
  const roomWebsocket = useRef<WebSocket | null>(null);
  
  // Load lesson data and check access
  useEffect(() => {
    const fetchLessonData = async () => {
      if (!lessonId || !user) return;
      
      try {
        setLoading(true);
        const lessonData = await getLessonById(parseInt(lessonId));
        
        // Verify that the current user is either the student or tutor for this lesson
        if (lessonData.student_id !== user.id && lessonData.tutor_id !== user.id) {
          setError(t('pages.lesson_room.unauthorized'));
          return;
        }
        
        setLesson(lessonData);
        
        // Connect to the room
        await connectToRoom(lessonId);
      } catch (err) {
        console.error('Error loading lesson:', err);
        setError(t('pages.lesson_room.load_error'));
        toast.error(t('pages.lesson_room.load_error'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessonData();
    
    // Clean up function
    return () => {
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (roomWebsocket.current) {
        roomWebsocket.current.close();
      }
      if (chatWebsocket.current) {
        chatWebsocket.current.close();
      }
    };
  }, [lessonId, user, t]);
  
  // Function to connect to the video room
  const connectToRoom = async (roomId: string) => {
    try {
      setConnecting(true);
      
      // Join or create the room
      await joinRoom(roomId);
      
      // Get user media (camera and microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { max: 1280 },
          height: { max: 720 },
          aspectRatio: 4 / 3,
          frameRate: 30,
        },
        audio: {
          sampleSize: 16,
          channelCount: 2,
          echoCancellation: true
        }
      });
      
      localStream.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Set up WebRTC connection
      setupWebRTC(roomId, stream);
      
      // Set up chat WebSocket
      setupChatWebSocket(roomId);
      
      // Set connected state
      setConnected(true);
    } catch (err) {
      console.error('Error connecting to room:', err);
      setError(t('pages.lesson_room.connection_error'));
      toast.error(t('pages.lesson_room.connection_error'));
    } finally {
      setConnecting(false);
    }
  };
  
  // Setup WebRTC peer connection
  const setupWebRTC = (roomId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:relay.metered.ca:80" },
        {
          urls: "turn:relay.metered.ca:80",
          username: "f656bb327ada11408d2cd592",
          credential: "D5FTwyiln3XE0vFq",
        },
      ],
    });
    
    peerConnection.current = pc;
    
    // Add local tracks to the peer connection
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    // Handle incoming tracks (remote video/audio)
    pc.ontrack = (event) => {
      if (event.track.kind === 'video' && remoteVideoContainer.current) {
        const videoElement = document.createElement('video');
        videoElement.srcObject = event.streams[0];
        videoElement.className = 'w-full h-full object-cover rounded-lg';
        videoElement.autoplay = true;
        videoElement.controls = true;
        videoElement.playsInline = true;
        
        // Remove existing videos first
        while (remoteVideoContainer.current.firstChild) {
          remoteVideoContainer.current.removeChild(remoteVideoContainer.current.firstChild);
        }
        
        remoteVideoContainer.current.appendChild(videoElement);
        
        // Handle track ending
        event.streams[0].onremovetrack = () => {
          if (videoElement.parentNode) {
            videoElement.parentNode.removeChild(videoElement);
          }
        };
      }
    };
    
    // Connect to the signaling server via WebSocket
    const wsUrl = getRoomWebsocketUrl(roomId);
    const ws = new WebSocket(wsUrl);
    roomWebsocket.current = ws;
    
    // Handle ICE candidates
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      
      ws.send(JSON.stringify({
        event: 'candidate',
        data: JSON.stringify(e.candidate)
      }));
    };
    
    // Handle WebSocket messages
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (!msg) {
        return console.log('failed to parse msg');
      }
      
      switch (msg.event) {
        case 'offer':
          const offer = JSON.parse(msg.data);
          if (!offer) {
            return console.log('failed to parse offer');
          }
          
          pc.setRemoteDescription(new RTCSessionDescription(offer))
            .then(() => pc.createAnswer())
            .then(answer => pc.setLocalDescription(answer))
            .then(() => {
              ws.send(JSON.stringify({
                event: 'answer',
                data: JSON.stringify(pc.localDescription)
              }));
            })
            .catch(err => console.error('Error handling offer:', err));
          break;
          
        case 'candidate':
          const candidate = JSON.parse(msg.data);
          if (!candidate) {
            return console.log('failed to parse candidate');
          }
          
          pc.addIceCandidate(new RTCIceCandidate(candidate))
            .catch(err => console.error('Error adding ICE candidate:', err));
          break;
      }
    };
    
    // Handle WebSocket errors and reconnection
    ws.onclose = () => {
      console.log('WebSocket closed, attempting to reconnect...');
      setTimeout(() => {
        if (localStream.current) {
          setupWebRTC(roomId, localStream.current);
        }
      }, 1000);
    };
    
    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  };
  
  // Setup chat WebSocket
  const setupChatWebSocket = (roomId: string) => {
    const chatWsUrl = getRoomChatWebsocketUrl(roomId);
    const ws = new WebSocket(chatWsUrl);
    chatWebsocket.current = ws;
    
    ws.onmessage = (evt) => {
      const messages = evt.data.split('\n');
      
      messages.forEach((messageText: string) => {
        if (!messageText) return;
        
        // Check if the message is from the current user
        const isSelf = messageText.includes(`${user?.username}:`);
        const text = messageText;
        
        setMessages(prev => [
          ...prev, 
          { 
            text, 
            time: getCurrentTime(), 
            isSelf 
          }
        ]);
        
        if (!chatVisible) {
          setNewMessageAlert(true);
        }
      });
    };
    
    ws.onclose = () => {
      console.log('Chat WebSocket closed, attempting to reconnect...');
      setTimeout(() => {
        setupChatWebSocket(roomId);
      }, 1000);
    };
    
    ws.onerror = (err) => {
      console.error('Chat WebSocket error:', err);
    };
  };
  
  // Get current time for chat messages
  const getCurrentTime = () => {
    const date = new Date();
    let hour = date.getHours();
    let minute = date.getMinutes();
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    const minuteStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${hourStr}:${minuteStr}`;
  };
  
  // Handle sending chat messages
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessage.trim() || !chatWebsocket.current) return;
    
    chatWebsocket.current.send(chatMessage);
    setChatMessage('');
  };
  
  // Toggle chat visibility
  const toggleChat = () => {
    setChatVisible(!chatVisible);
    if (!chatVisible) {
      setNewMessageAlert(false);
    }
  };
  
  // Handle navigation back to lessons
  const handleBackToLessons = () => {
    navigate('/my-lessons');
  };
  
  // Render loading state
  if (loading || connecting) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">
            {connecting ? t('pages.lesson_room.connecting') : t('pages.lesson_room.loading')}
          </p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error || !lesson) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('pages.lesson_room.error_title')}</h2>
          <p className="text-gray-700 mb-4">{error || t('pages.lesson_room.lesson_not_found')}</p>
          <button
            onClick={handleBackToLessons}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            {t('pages.lesson_room.back_to_lessons')}
          </button>
        </div>
      </div>
    );
  }
  
  // Calculate who the other participant is
  const isStudent = lesson.student_id === user?.id;
  const otherParticipant = isStudent ? lesson.tutor : lesson.student;
  const otherParticipantName = otherParticipant 
    ? `${otherParticipant.first_name || ''} ${otherParticipant.last_name || ''}`.trim() || otherParticipant.username
    : t('pages.lesson_room.unknown_participant');
    
  // Format end time
  const formattedEndTime = lesson.end_time ? format(new Date(lesson.end_time), 'HH:mm') : '';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {lesson.language?.name || t('common.unknown')} | {formattedEndTime} | {otherParticipantName}
        </h1>
        <button
          onClick={handleBackToLessons}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
          </svg>
          {t('pages.lesson_room.back_to_lessons')}
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Video Section */}
        <div className="col-span-2 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm h-[600px]">
          <div className="flex flex-wrap h-full">
            <div className="w-full h-1/2 p-2">
              {connected ? (
                <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute bottom-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                    {user?.username} (You)
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-sm text-gray-500">{t('pages.lesson_room.camera_loading')}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="w-full h-1/2 p-2">
              <div 
                ref={remoteVideoContainer}
                className="w-full h-full rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
              >
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                  <p className="text-sm text-gray-500">{t('pages.lesson_room.waiting_for_other')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Section */}
        <div className="col-span-1 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm h-[600px] flex flex-col">
          <div 
            className="bg-gray-100 px-4 py-3 flex items-center justify-between cursor-pointer"
            onClick={toggleChat}
          >
            <h3 className="font-medium text-gray-800">{t('pages.lesson_room.chat')}</h3>
            {newMessageAlert && !chatVisible && (
              <span className="bg-orange-500 h-2 w-2 rounded-full"></span>
            )}
          </div>
          
          {chatVisible && (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-sm">{t('pages.lesson_room.no_messages')}</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div 
                      key={index} 
                      className={`mb-3 ${message.isSelf ? 'text-right' : 'text-left'}`}
                    >
                      <div 
                        className={`inline-block px-4 py-2 rounded-lg ${
                          message.isSelf 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{message.time}</p>
                    </div>
                  ))
                )}
              </div>
              
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder={t('pages.lesson_room.type_message')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700 transition-colors"
                  >
                    {t('pages.lesson_room.send')}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonRoom; 