import React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';

export const ScheduleLesson = () => {
  const { tutorId } = useParams<{ tutorId: string }>();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('pages.schedule_lesson.title')}</h1>
      <p className="text-lg">
        {t('pages.schedule_lesson.tutor_id')}: {tutorId}
      </p>
      <p className="mt-4">{t('pages.schedule_lesson.coming_soon')}</p>
    </div>
  );
}; 