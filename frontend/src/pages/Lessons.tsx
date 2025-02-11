import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Tabs, Select, Spin } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { LessonList } from '../components/lessons/LessonList';
import { useLessons, Lesson } from '../hooks/useLessons';

export const Lessons: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

    const { lessons = [], loading, error, refreshLessons, cancelLesson } = useLessons({
        type: activeTab,
    });

    const filteredLessons = React.useMemo(() => {
        if (!Array.isArray(lessons)) return [];
        return lessons.filter(lesson => {
            if (filter === 'all') return true;
            return lesson.status === filter;
        });
    }, [lessons, filter]);

    const handleCancelLesson = (lesson: Lesson) => {
        if (!user) return;
        
        Modal.confirm({
            title: 'Cancel Lesson',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Are you sure you want to cancel this lesson?</p>
                    <p className="text-gray-500 mt-2">
                        This action cannot be undone.
                    </p>
                </div>
            ),
            okText: 'Yes, Cancel Lesson',
            okButtonProps: { danger: true },
            cancelText: 'No, Keep Lesson',
            onOk: () => cancelLesson(lesson.id, `Cancelled by ${user.credentials.role}`),
        });
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    const tabItems = [
        {
            key: 'upcoming',
            label: 'Upcoming',
        },
        {
            key: 'completed',
            label: 'Past',
        },
    ];

    if (error) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="text-red-500 mb-4">{error}</div>
                    <button
                        onClick={() => refreshLessons()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lessons</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeTab === 'upcoming' ? 'Manage your upcoming lessons' : 'View your lesson history'}
                    </p>
                </div>
                <div className="flex space-x-4">
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as 'upcoming' | 'completed')}
                        items={tabItems}
                        className="mb-0"
                    />
                    <Select
                        value={filter}
                        onChange={(value) => setFilter(value)}
                        className="min-w-[150px]"
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <Spin size="large" />
                            <div className="mt-4 text-gray-500">Loading your lessons...</div>
                        </div>
                    </div>
                ) : (
                    <LessonList
                        lessons={filteredLessons}
                        userRole={user.credentials.role}
                        onCancelLesson={handleCancelLesson}
                    />
                )}
            </div>
        </div>
    );
}; 