import React, { useState } from 'react';
import { Tabs, Modal, Button, Spin } from 'antd';
import { LessonList } from '../components/lessons/LessonList';
import { useLessons, Lesson } from '../hooks/useLessons';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';

export const Lessons: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [filter, setFilter] = useState<string>('all');
    const { user } = useAuth();
    const { t } = useTranslation();

    const { lessons = [], loading, error, refreshLessons, cancelLesson } = useLessons({
        type: activeTab,
    });

    const handleCancelLesson = (lesson: Lesson) => {
        Modal.confirm({
            title: 'Cancel Lesson',
            icon: <i className="fas fa-exclamation-circle text-yellow-500" />,
            content: (
                <>
                    <p>Are you sure you want to cancel this lesson?</p>
                    <p className="text-sm text-gray-500">
                        This action cannot be undone.
                    </p>
                </>
            ),
            okButtonProps: {
                danger: true,
                className: 'bg-red-500 hover:bg-red-600',
            },
            okText: 'Yes, Cancel Lesson',
            cancelButtonProps: {
                className: 'border-gray-300 text-gray-700',
            },
            cancelText: 'No, Keep Lesson',
            onOk: () => cancelLesson(lesson.id, `Cancelled by ${user.credentials.role}`),
        });
    };

    const items = [
        {
            key: 'upcoming',
            label: t('lessons.tabs.upcoming'),
            children: (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="form-select rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="all">{t('lessons.filters.all')}</option>
                                <option value="scheduled">{t('lessons.filters.scheduled')}</option>
                                <option value="in_progress">{t('lessons.filters.in_progress')}</option>
                            </select>
                        </div>
                        <Button
                            type="default"
                            icon={<i className="fas fa-sync" />}
                            onClick={() => refreshLessons()}
                        >
                            {t('lessons.actions.refresh')}
                        </Button>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spin size="large" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-4">{error}</div>
                    ) : (
                        <LessonList
                            lessons={lessons.filter(lesson => filter === 'all' || lesson.status === filter)}
                            userRole={user.credentials.role}
                            onCancelLesson={handleCancelLesson}
                        />
                    )}
                </div>
            ),
        },
        {
            key: 'completed',
            label: t('lessons.tabs.completed'),
            children: (
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Spin size="large" />
                        </div>
                    ) : error ? (
                        <div className="text-red-500 text-center py-4">{error}</div>
                    ) : (
                        <LessonList
                            lessons={lessons}
                            userRole={user.credentials.role}
                            onCancelLesson={handleCancelLesson}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lessons</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {activeTab === 'upcoming' ? 'Manage your upcoming lessons' : 'View your lesson history'}
                    </p>
                </div>

                <div className="p-6">
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as 'upcoming' | 'completed')}
                        items={items}
                        className="lesson-tabs"
                    />
                </div>
            </div>
        </div>
    );
}; 