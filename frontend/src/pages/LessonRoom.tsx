import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { getLessonById } from '../services/lesson.service';
import { joinRoom } from '../services/videoRoom.service';
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
  
  // Refs for video room
  const videoRef = useRef<HTMLIFrameElement>(null);
  const roomUrlRef = useRef<string | null>(null);
  
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
  }, [lessonId, user, t]);
  
  // Function to connect to the video room
  const connectToRoom = async (roomId: string) => {
    try {
      setConnecting(true);
      
      // Join or create the room
      const roomUrl = await joinRoom(roomId);
      roomUrlRef.current = roomUrl;
      
      // Set connected state
      setConnected(true);
    } catch (err) {
      console.error('Error connecting to room:', err);
      setError(t('pages.lesson_room.connection_error'));
      toast.error(t('pages.lesson_room.connection_error'));
      
      // Try to recover by setting connected to true anyway so the iframe will be shown
      // This is a fallback in case the API calls fail but the room URL might still work
      if (!connected && roomId) {
        const videoApiUrl = process.env.REACT_APP_VIDEO_API_URL || 'https://192.168.0.100:8081';
        roomUrlRef.current = `${videoApiUrl}/room/${roomId}`;
        setConnected(true);
      }
    } finally {
      setConnecting(false);
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
      
      {/* Video and Chat Container */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm h-[600px]">
          {connected && roomUrlRef.current ? (
            <iframe
              ref={videoRef}
              src={roomUrlRef.current}
              className="w-full h-full border-0"
              allow="camera; microphone"
              title="Lesson Room"
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
                  onClick={() => connectToRoom(lessonId!)}
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