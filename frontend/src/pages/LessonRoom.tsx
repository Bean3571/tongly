import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { joinRoom } from '../services/videoRoom.service';
import { toast } from 'react-hot-toast';

const LessonRoom: React.FC = () => {
  const { t } = useTranslation();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);
  const [videoConnected, setVideoConnected] = useState<boolean>(false);
  const [chatConnected, setChatConnected] = useState<boolean>(false);
  const [chatVisible, setChatVisible] = useState<boolean>(true);
  
  // Refs for video and chat
  const videoRef = useRef<HTMLIFrameElement>(null);
  const chatRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    const connectToVideoRoom = async () => {
      if (!lessonId) return;
      
      try {
        setConnecting(true);
        
        // Create/join the room
        await joinRoom(lessonId);
        
        // Set connected states
        setVideoConnected(true);
        setChatConnected(true);
        
      } catch (err) {
        console.error('Error connecting to room:', err);
        setError(t('pages.lesson_room.connection_error'));
        toast.error(t('pages.lesson_room.connection_error'));
      } finally {
        setLoading(false);
        setConnecting(false);
      }
    };
    
    connectToVideoRoom();
  }, [lessonId, t]);
  
  // Toggle chat visibility
  const toggleChat = () => {
    setChatVisible(!chatVisible);
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
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">{t('pages.lesson_room.error_title')}</h2>
          <p className="text-gray-700 mb-4">{error}</p>
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

  // API URL base
  const videoApiUrl = process.env.REACT_APP_VIDEO_API_URL || 'https://192.168.0.100:8081';
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
          {t('pages.lesson_room.title')}
        </h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleChat}
            className={`px-4 py-2 rounded-md transition-colors ${chatVisible 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {chatVisible ? t('pages.lesson_room.hide_chat') : t('pages.lesson_room.show_chat')}
          </button>
          <button
            onClick={handleBackToLessons}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
            </svg>
            {t('pages.lesson_room.leave_room')}
          </button>
        </div>
      </div>
      
      {/* Video and Chat Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Video Section */}
        <div className={`${chatVisible ? 'md:col-span-8' : 'md:col-span-12'} rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm ${chatVisible ? 'h-[50vh]' : 'h-[80vh]'} md:h-[calc(100vh-12rem)]`}>
          {videoConnected ? (
            <iframe
              ref={videoRef}
              src={`${videoApiUrl}/api/room/${lessonId}/video`}
              className="w-full h-full border-0"
              allow="camera; microphone"
              title="Video Room"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center p-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pages.lesson_room.placeholder.title')}</h3>
                <p className="text-gray-600 mb-4">{t('pages.lesson_room.placeholder.description')}</p>
                <button
                  onClick={() => {
                    setConnecting(true);
                    joinRoom(lessonId!).then(() => {
                      setVideoConnected(true);
                      setChatConnected(true);
                    }).catch(err => {
                      console.error('Error reconnecting:', err);
                      toast.error(t('pages.lesson_room.connection_error'));
                    }).finally(() => {
                      setConnecting(false);
                    });
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  {t('pages.lesson_room.reconnect')}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Chat Section - always in DOM but conditionally visible */}
        <div className={`md:col-span-4 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm h-[35vh] md:h-[calc(100vh-12rem)] ${chatVisible ? 'block' : 'hidden md:hidden'}`}>
          {chatConnected ? (
            <iframe
              ref={chatRef}
              src={`${videoApiUrl}/api/room/${lessonId}/chat`}
              className="w-full h-full border-0"
              title="Chat Room"
            ></iframe>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center p-6">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pages.lesson_room.chat_placeholder.title')}</h3>
                <p className="text-gray-600 mb-4">{t('pages.lesson_room.chat_placeholder.description')}</p>
                <button
                  onClick={() => {
                    setConnecting(true);
                    joinRoom(lessonId!).then(() => {
                      setVideoConnected(true);
                      setChatConnected(true);
                    }).catch(err => {
                      console.error('Error reconnecting:', err);
                      toast.error(t('pages.lesson_room.connection_error'));
                    }).finally(() => {
                      setConnecting(false);
                    });
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  {t('pages.lesson_room.reconnect')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonRoom; 