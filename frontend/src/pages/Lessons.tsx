import React, { useEffect, useState } from 'react';
import { Lesson } from '../types/lesson';
import LessonCard from '../components/LessonCard';
import { useTranslation } from '../contexts/I18nContext';
import { useNotification } from '../contexts/NotificationContext';
import { lessonService } from '../services/api';
import { useNavigate } from 'react-router-dom';

type LessonFilter = 'all' | 'scheduled' | 'past' | 'cancelled';

export const Lessons: React.FC = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LessonFilter>('all');
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLessons();
  }, []);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonService.getLessons();
      setLessons(data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showNotification('error', t('lessons.errors.fetch_lessons'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (lessonId: number) => {
    try {
      await lessonService.cancelLesson(lessonId);
      showNotification('success', t('lessons.cancelled_success'));
      setLessons(prevLessons =>
        prevLessons.map(lesson =>
          lesson.id === lessonId
            ? { ...lesson, cancelled: true }
            : lesson
        )
      );
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      showNotification('error', t('lessons.errors.cancel_lesson'));
    }
  };

  const handleJoin = async (lessonId: number) => {
    try {
      const roomInfo = await lessonService.joinLesson(lessonId);
      showNotification('success', t('lessons.joined_success'));
      navigate(`/lessons/${lessonId}/room`, { state: roomInfo });
    } catch (error) {
      console.error('Error joining lesson:', error);
      showNotification('error', t('lessons.errors.join_lesson'));
    }
  };

  const now = new Date();

  const filteredLessons = lessons.filter(lesson => {
    const endTime = new Date(lesson.end_time);
    
    switch (activeTab) {
      case 'scheduled':
        return !lesson.cancelled && endTime >= now;
      case 'past':
        return !lesson.cancelled && endTime < now;
      case 'cancelled':
        return lesson.cancelled;
      case 'all':
      default:
        return true;
    }
  });

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    const aTime = new Date(a.start_time).getTime();
    const bTime = new Date(b.start_time).getTime();
    return aTime - bTime;
  });

  const tabs = [
    { id: 'all', label: t('lessons.tabs.all') },
    { id: 'scheduled', label: t('lessons.tabs.scheduled') },
    { id: 'past', label: t('lessons.tabs.past') },
    { id: 'cancelled', label: t('lessons.tabs.cancelled') }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('lessons.title')}</h1>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as LessonFilter)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lessons Grid */}
      {sortedLessons.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          <p>{t('lessons.no_lessons')}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedLessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 