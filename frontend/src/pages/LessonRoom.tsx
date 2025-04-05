import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson } from '../types/lesson';
import { getLessonById } from '../services/lesson.service';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useTranslation } from '../contexts/I18nContext';

const LessonRoom: React.FC = () => {
  const { t } = useTranslation();
  const { lessonId } = useParams<{ lessonId: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        toast.error('Lesson ID is missing');
        navigate('/lessons');
        return;
      }

      try {
        setLoading(true);
        const fetchedLesson = await getLessonById(parseInt(lessonId, 10));
        setLesson(fetchedLesson);
        
        // Verify if the lesson can be joined
        const now = new Date();
        const startTime = new Date(fetchedLesson.start_time);
        const endTime = new Date(fetchedLesson.end_time);
        
        if (fetchedLesson.cancelled_at) {
          toast.error('This lesson has been cancelled');
          navigate('/lessons');
          return;
        }
        
        if (now < new Date(startTime.getTime() - 5 * 60 * 1000)) {
          toast.error('This lesson has not started yet');
          navigate('/lessons');
          return;
        }
        
        if (now > endTime) {
          toast.error('This lesson has already ended');
          navigate('/lessons');
          return;
        }
      } catch (error) {
        console.error('Error fetching lesson:', error);
        toast.error('Failed to load lesson details');
        navigate('/lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  // Format dates
  const startTime = new Date(lesson.start_time);
  const endTime = new Date(lesson.end_time);
  const formattedDate = format(startTime, 'MMMM d, yyyy');
  const formattedTimeRange = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 mb-6">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-orange-100">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('pages.lesson_room.title')} {lesson.student?.first_name || lesson.tutor?.first_name} {lesson.student?.last_name || lesson.tutor?.last_name}
          </h1>
          <div className="text-right">
            <div className="text-gray-600">{formattedDate}</div>
            <div className="text-orange-600 font-medium">{formattedTimeRange}</div>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('pages.lesson_room.language')}: <span className="text-orange-600">{lesson.language?.name}</span></h2>
          {lesson.notes && (
            <div className="bg-orange-50 p-4 rounded-md">
              <h3 className="font-medium text-gray-700 mb-1">{t('pages.lesson_room.notes')}:</h3>
              <p className="text-gray-600">{lesson.notes}</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-orange-100">
          <h2 className="text-xl font-medium text-gray-700 mb-2">{t('pages.lesson_room.placeholder.title')}</h2>
          <p className="text-gray-600 mb-4">{t('pages.lesson_room.placeholder.description')}</p>
          <p className="text-gray-500">{t('pages.lesson_room.placeholder.future_features')}</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/lessons')}
          className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
        >
          {t('pages.lesson_room.back_to_lessons')}
        </button>
      </div>
    </div>
  );
};

export default LessonRoom; 