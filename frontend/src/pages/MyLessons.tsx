import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lesson, LessonStatus } from '../types/lesson';
import { getUserLessons, getScheduledLessons, getPastLessons, getCancelledLessons } from '../services/lesson.service';
import LessonCard from '../components/LessonCard';
import { toast } from 'react-hot-toast';
import { User, UserRole } from '../types';
import { useTranslation } from '../contexts/I18nContext';

// Filter types
type FilterType = 'all' | 'scheduled' | 'past' | 'cancelled';

const MyLessons: React.FC = () => {
  const { t } = useTranslation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('scheduled');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user from localStorage
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Load lessons based on the active filter
    fetchLessons(activeFilter);
  }, [activeFilter]);

  const fetchLessons = async (filter: FilterType) => {
    setLoading(true);
    try {
      let fetchedLessons: Lesson[];

      switch (filter) {
        case 'scheduled':
          console.log('Fetching scheduled lessons');
          fetchedLessons = await getScheduledLessons();
          break;
        case 'past':
          console.log('Fetching past lessons');
          fetchedLessons = await getPastLessons();
          break;
        case 'cancelled':
          console.log('Fetching cancelled lessons');
          fetchedLessons = await getCancelledLessons();
          break;
        default:
          console.log('Fetching all lessons');
          fetchedLessons = await getUserLessons();
      }

      console.log(`Received ${fetchedLessons.length} lessons for filter: ${filter}`);

      // Add virtual status property to each lesson
      const processedLessons = fetchedLessons.map(lesson => {
        // Calculate status if not already provided by the API
        if (!lesson.status) {
          if (lesson.cancelled_at) {
            lesson.status = LessonStatus.CANCELLED;
          } else {
            const now = new Date();
            const startTime = new Date(lesson.start_time);
            const endTime = new Date(lesson.end_time);

            if (now < startTime) {
              lesson.status = LessonStatus.SCHEDULED;
            } else if (now >= startTime && now <= endTime) {
              lesson.status = LessonStatus.IN_PROGRESS;
            } else {
              lesson.status = LessonStatus.COMPLETED;
            }
          }
        }
        return lesson;
      });

      setLessons(processedLessons);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleCancelSuccess = () => {
    // Refresh the lesson list after a cancellation
    fetchLessons(activeFilter);
  };

  const renderFilterTabs = () => {
    const filters: { value: FilterType; label: string }[] = [
      { value: 'scheduled', label: t('pages.my_lessons.filters.scheduled') },
      { value: 'past', label: t('pages.my_lessons.filters.past') },
      { value: 'cancelled', label: t('pages.my_lessons.filters.cancelled') },
    ];

    return (
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            className={`px-4 py-2 text-sm font-medium rounded-md flex-1 transition-colors ${
              activeFilter === filter.value
                ? 'bg-white shadow-sm text-orange-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => handleFilterChange(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    const isTutor = currentUser?.role === UserRole.TUTOR;
    let message = '';
    let actionButton = null;
    
    switch (activeFilter) {
      case 'scheduled':
        message = isTutor 
          ? t('pages.my_lessons.empty_state.no_scheduled_tutor')
          : t('pages.my_lessons.empty_state.no_scheduled_student');
        if (!isTutor) {
          actionButton = (
            <button
              onClick={() => navigate('/search-tutors')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              {t('pages.my_lessons.empty_state.find_tutor')}
            </button>
          );
        }
        break;
      case 'past':
        message = t('pages.my_lessons.empty_state.no_past');
        break;
      case 'cancelled':
        message = t('pages.my_lessons.empty_state.no_cancelled');
        break;
      default:
        message = t('pages.my_lessons.empty_state.no_lessons');
    }
    
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('pages.my_lessons.empty_state.no_lessons')}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        {actionButton}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('pages.my_lessons.title')}</h1>
      </div>

      {renderFilterTabs()}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">{t('pages.my_lessons.loading')}</span>
        </div>
      ) : lessons.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              currentUserId={currentUser?.id || 0}
              onCancelSuccess={handleCancelSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLessons; 