import React from 'react';
import { format } from 'date-fns';
import { Lesson, LessonStatus } from '../types/lesson';
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

  const canCancel = () => {
    if (lesson.status !== LessonStatus.SCHEDULED) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(lesson.start_time);
    const twentyFourHoursBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);

    return now <= twentyFourHoursBefore;
  };

  const getStatusColor = () => {
    switch (lesson.status) {
      case LessonStatus.SCHEDULED:
        return 'text-orange-600';
      case LessonStatus.IN_PROGRESS:
        return 'text-green-600';
      case LessonStatus.COMPLETED:
        return 'text-gray-600';
      case LessonStatus.CANCELLED:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (lesson.status) {
      case LessonStatus.SCHEDULED:
        return t('lessons.status.scheduled');
      case LessonStatus.IN_PROGRESS:
        return t('lessons.status.in_progress');
      case LessonStatus.COMPLETED:
        return t('lessons.status.completed');
      case LessonStatus.CANCELLED:
        return t('lessons.status.cancelled');
      default:
        return lesson.status;
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
        <span className="text-lg font-semibold text-orange-600">${lesson.price}</span>
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