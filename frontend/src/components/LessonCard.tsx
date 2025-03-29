import React from 'react';
import { format } from 'date-fns';
import { Lesson } from '../types/lesson';
import { Button } from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { Avatar } from './ui/Avatar';

interface LessonCardProps {
  lesson: Lesson;
  onCancel: (lessonId: number) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onCancel }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const isStudent = user?.credentials.role === 'student';
  
  // Get the other participant's info
  const participant = isStudent ? lesson.tutor : lesson.student;
  const displayName = participant.first_name && participant.last_name 
    ? `${participant.first_name} ${participant.last_name}`
    : participant.username;

  const now = new Date();
  const startTime = new Date(lesson.start_time);
  const endTime = new Date(lesson.end_time);

  const canCancel = () => {
    if (lesson.cancelled) {
      return false;
    }
    
    // Can only cancel future lessons
    if (now >= startTime) {
      return false;
    }

    const twentyFourHoursBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
    return now <= twentyFourHoursBefore;
  };

  const getLessonStatus = () => {
    if (lesson.cancelled) {
      return 'cancelled';
    }

    if (now < startTime) {
      return 'scheduled';
    }

    if (now >= startTime && now <= endTime) {
      return 'in_progress';
    }

    if (now > endTime) {
      return 'completed';
    }

    return 'scheduled';
  };

  const getStatusColor = () => {
    const status = getLessonStatus();
    switch (status) {
      case 'scheduled':
        return 'text-orange-600';
      case 'in_progress':
        return 'text-green-600';
      case 'completed':
        return 'text-gray-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    const status = getLessonStatus();
    switch (status) {
      case 'scheduled':
        return t('lessons.status.scheduled');
      case 'in_progress':
        return t('lessons.status.in_progress');
      case 'completed':
        return t('lessons.status.completed');
      case 'cancelled':
        return t('lessons.status.cancelled');
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start space-x-4 mb-4">
        <Avatar
          src={participant.avatar_url}
          alt={displayName}
          className="w-12 h-12 rounded-full"
        />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{displayName}</h3>
          <p className="text-gray-600">{lesson.language}</p>
        </div>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">{t('lessons.start_time')}</p>
          <p className="font-medium">{format(new Date(lesson.start_time), 'PPp')}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{t('lessons.end_time')}</p>
          <p className="font-medium">{format(new Date(lesson.end_time), 'PPp')}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {canCancel() && (
            <Button
              variant="outline"
              onClick={() => onCancel(lesson.id)}
              className="text-red-600 border-red-600 hover:bg-red-50"
            >
              {t('lessons.actions.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonCard; 