import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { useNotification } from '../contexts/NotificationContext';
import { lessonService } from '../services/api';
import { Lesson, LessonStatus } from '../types/lesson';
import { Avatar } from './ui/Avatar';

interface RoomParticipant {
  id: number;
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  joined_at: string;
}

interface RoomInfo {
  room_id: string;
  token: string;
  participants: RoomParticipant[];
}

export const LessonRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonAndRoom = async () => {
      try {
        setLoading(true);
        const [lessonData, roomData] = await Promise.all([
          lessonService.getLesson(Number(lessonId)),
          lessonService.joinLesson(Number(lessonId))
        ]);

        setLesson(lessonData);
        setRoomInfo(roomData);
      } catch (error) {
        console.error('Error fetching lesson room data:', error);
        showNotification('error', t('lessons.errors.join.lesson'));
        navigate('/lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonAndRoom();

    // Poll for updated participant list every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const roomData = await lessonService.getRoomInfo(Number(lessonId));
        setRoomInfo(roomData);
      } catch (error) {
        console.error('Error polling room info:', error);
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      // Leave room when component unmounts
      lessonService.leaveLesson(Number(lessonId)).catch(console.error);
    };
  }, [lessonId, navigate, showNotification, t]);

  if (loading || !lesson || !roomInfo) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t('lessons.room.title')}</h1>
          <span className="text-gray-600">
            {t('lessons.room.id')}: {roomInfo.room_id}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('lessons.room.participants')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomInfo.participants.map((participant) => (
              <div
                key={participant.user_id}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <Avatar
                  src={participant.avatar_url}
                  alt={participant.username}
                  className="w-12 h-12"
                />
                <div>
                  <p className="font-medium">
                    {participant.first_name && participant.last_name
                      ? `${participant.first_name} ${participant.last_name}`
                      : participant.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(participant.joined_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/lessons')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    </div>
  );
}; 