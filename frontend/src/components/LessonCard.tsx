import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lesson, LessonStatus } from '../types/lesson';
import { format } from 'date-fns';
import { cancelLesson } from '../services/lesson.service';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../contexts/I18nContext';
import { envConfig } from '../config/env';

const DEFAULT_AVATAR = envConfig.defaultAvatar;

interface LessonCardProps {
  lesson: Lesson;
  currentUserId: number;
  onCancelSuccess?: () => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, currentUserId, onCancelSuccess }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Determine if the current user is the student or tutor
  const isStudent = lesson.student_id === currentUserId;
  const otherParticipant = isStudent ? lesson.tutor : lesson.student;

  // Parse dates
  const startTime = new Date(lesson.start_time);
  const endTime = new Date(lesson.end_time);
  
  // Format dates
  const dateStr = format(startTime, 'MMM d, yyyy');
  const startTimeStr = format(startTime, 'HH:mm');
  const endTimeStr = format(endTime, 'HH:mm');
  
  // Check if the lesson can be joined (only between start and end time)
  const now = new Date();
  const canJoin = now >= new Date(startTime.getTime() - 5 * 60 * 1000) && now <= endTime;
  
  // Check if the lesson can be cancelled (only if it's more than 24 hours before start time)
  const canCancel = 
    lesson.status === LessonStatus.SCHEDULED && 
    startTime.getTime() - now.getTime() > 24 * 60 * 60 * 1000;

  const handleJoinLesson = () => {
    // TODO: Implement join lesson!!!!
    navigate(`/lessons/room/${lesson.id}`);
  };

  const handleCancelLesson = async () => {
    try {
      if (!window.confirm(t('components.lesson_card.cancel_confirm'))) {
        return;
      }
      
      await cancelLesson(lesson.id, "User cancelled the lesson");
      toast.success(t('components.lesson_card.cancel_success'));
      if (onCancelSuccess) {
        onCancelSuccess();
      }
    } catch (error) {
      toast.error(t('components.lesson_card.cancel_error'));
      console.error('Error cancelling lesson:', error);
    }
  };

  // Get participant name and image safely
  const participantName = otherParticipant 
    ? (otherParticipant.first_name && otherParticipant.last_name)
      ? `${otherParticipant.first_name} ${otherParticipant.last_name}`
      : otherParticipant.username || t('components.lesson_card.unknown_participant')
    : t('components.lesson_card.unknown_participant');
  
  const participantImage = otherParticipant?.profile_picture_url || DEFAULT_AVATAR;

  // Status colors - orange theme
  const getStatusStyle = () => {
    switch (lesson.status) {
      case LessonStatus.SCHEDULED:
        return { bg: 'rgba(249, 115, 22, 0.1)', text: 'rgb(234, 88, 12)' };
      case LessonStatus.IN_PROGRESS:
        return { bg: 'rgba(16, 185, 129, 0.1)', text: 'rgb(5, 150, 105)' };
      case LessonStatus.COMPLETED:
        return { bg: 'rgba(107, 114, 128, 0.1)', text: 'rgb(75, 85, 99)' };
      case LessonStatus.CANCELLED:
        return { bg: 'rgba(239, 68, 68, 0.1)', text: 'rgb(220, 38, 38)' };
      default:
        return { bg: 'rgba(249, 115, 22, 0.1)', text: 'rgb(234, 88, 12)' };
    }
  };

  const statusStyle = getStatusStyle();

  // Get status translation
  const getStatusTranslation = () => {
    switch (lesson.status) {
      case LessonStatus.SCHEDULED:
        return t('components.lesson_card.status.scheduled');
      case LessonStatus.IN_PROGRESS:
        return t('components.lesson_card.status.in_progress');
      case LessonStatus.COMPLETED:
        return t('components.lesson_card.status.completed');
      case LessonStatus.CANCELLED:
        return t('components.lesson_card.status.cancelled');
      default:
        return t('components.lesson_card.status.scheduled');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-200">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <img 
              src={participantImage} 
              alt={participantName}
              className="w-12 h-12 rounded-full mr-3 object-cover border-2 border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_AVATAR;
              }}
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {participantName}
              </h3>
              <p className="text-gray-600">{lesson.language?.name || t('components.lesson_card.unknown_language')}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="inline-block px-2 py-1 text-xs font-semibold rounded-full mb-1"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text
              }}
            >
              {getStatusTranslation()}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="text-gray-700">{dateStr}</span>
          </div>
          
          <div className="flex items-center">
            <svg className="w-4 h-4 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="text-gray-700">{startTimeStr} - {endTimeStr}</span>
          </div>
        </div>
        
        {lesson.notes && (
          <div className="mb-4 bg-orange-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-1">{t('components.lesson_card.notes')}:</h4>
            <p className="text-gray-600 text-sm">{lesson.notes}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4">
          {canCancel && (
            <button 
              onClick={handleCancelLesson}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              {t('components.lesson_card.cancel_lesson')}
            </button>
          )}
          
          {canJoin && (
            <button
              onClick={handleJoinLesson}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              {t('components.lesson_card.join_lesson')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard; 