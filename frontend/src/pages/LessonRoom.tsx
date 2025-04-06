import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lesson } from '../types/lesson';
import { getLessonById } from '../services/lesson.service';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useTranslation } from '../contexts/I18nContext';
import LessonRoomComponent from '../components/LessonRoom';

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

  return <LessonRoomComponent lesson={lesson} />;
};

export default LessonRoom; 