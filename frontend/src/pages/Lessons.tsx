import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { message, notification, Tooltip, Spin, Empty, Modal, Button, Space } from 'antd';
import { InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

interface Lesson {
    id: number;
    student_id: number;
    tutor_id: number;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    language: string;
    price: number;
    duration: number;
    tutor_name?: string;
    student_name?: string;
}

export const Lessons: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');

    useEffect(() => {
        loadLessons();
    }, [activeTab]);

    const loadLessons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = 'http://localhost:8080/api';
            const endpoint = activeTab === 'upcoming' ? '/lessons/upcoming' : '/lessons/completed';

            const response = await fetch(`${apiUrl}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                notification.error({
                    message: 'Session Expired',
                    description: 'Please log in again to continue.',
                });
                navigate('/login');
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setLessons(data);
        } catch (error) {
            console.error('Error loading lessons:', error);
            notification.error({
                message: 'Error Loading Lessons',
                description: 'Failed to load your lessons. Please try again later.',
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredLessons = lessons.filter(lesson => {
        if (filter === 'all') return true;
        return lesson.status === filter;
    });

    const handleJoinLesson = (lessonId: number) => {
        navigate(`/lessons/${lessonId}`);
    };

    const handleCancelLesson = async (lesson: Lesson) => {
        Modal.confirm({
            title: 'Cancel Lesson',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Are you sure you want to cancel this lesson?</p>
                    <p className="text-gray-500 mt-2">
                        {formatDateTime(lesson.start_time)} with {getParticipantInfo(lesson)}
                    </p>
                </div>
            ),
            okText: 'Yes, Cancel Lesson',
            okButtonProps: { danger: true },
            cancelText: 'No, Keep Lesson',
            onOk: async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`http://localhost:8080/api/lessons/${lesson.id}/cancel`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            reason: 'Cancelled by ' + (user?.credentials.role || 'user'),
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to cancel lesson');
                    }

                    notification.success({
                        message: 'Lesson Cancelled',
                        description: 'The lesson has been successfully cancelled.',
                    });

                    // Reload lessons to update the list
                    loadLessons();
                } catch (error) {
                    console.error('Error cancelling lesson:', error);
                    notification.error({
                        message: 'Error',
                        description: 'Failed to cancel the lesson. Please try again.',
                    });
                }
            },
        });
    };

    const getLessonStatusBadge = (status: Lesson['status']) => {
        const statusStyles = {
            scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            in_progress: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
            cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDateTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return format(date, 'MMM d, yyyy h:mm a');
        } catch (error) {
            return 'Invalid date';
        }
    };

    const formatTime = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid time';
            }
            return format(date, 'h:mm a');
        } catch (error) {
            return 'Invalid time';
        }
    };

    const isLessonJoinable = (lesson: Lesson) => {
        try {
            const now = new Date();
            const startTime = new Date(lesson.start_time);
            const endTime = new Date(lesson.end_time);
            
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                return false;
            }
            
            return now >= startTime && now <= endTime && lesson.status === 'scheduled';
        } catch (error) {
            return false;
        }
    };

    const getTimeStatus = (lesson: Lesson) => {
        const startTime = new Date(lesson.start_time);
        const now = new Date();

        if (lesson.status === 'completed') {
            return 'Completed';
        }

        if (lesson.status === 'cancelled') {
            return 'Cancelled';
        }

        if (startTime > now) {
            return `Starts ${formatDistanceToNow(startTime, { addSuffix: true })}`;
        }

        if (isLessonJoinable(lesson)) {
            return 'In Progress - Join Now';
        }

        return formatDateTime(lesson.start_time);
    };

    const getParticipantInfo = (lesson: Lesson) => {
        const role = user?.credentials.role;
        const name = role === 'student' ? lesson.tutor_name : lesson.student_name;
        const defaultName = role === 'student' ? 'Tutor' : 'Student';
        
        return name || defaultName;
    };

    const renderActionButtons = (lesson: Lesson) => {
        if (isLessonJoinable(lesson)) {
            return (
                <button
                    onClick={() => handleJoinLesson(lesson.id)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Join Lesson
                </button>
            );
        }

        if (lesson.status === 'scheduled') {
            const startTime = new Date(lesson.start_time);
            const now = new Date();
            const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            return (
                <Space>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getTimeStatus(lesson)}
                    </div>
                    {hoursUntilStart > 24 && ( // Only show cancel button if more than 24 hours before start
                        <Button
                            danger
                            onClick={() => handleCancelLesson(lesson)}
                            className="ml-2"
                        >
                            Cancel
                        </Button>
                    )}
                </Space>
            );
        }

        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin size="large" tip="Loading your lessons..." />
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
                    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-4 py-2 ${
                                activeTab === 'upcoming'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`px-4 py-2 ${
                                activeTab === 'past'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            Past
                        </button>
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as typeof filter)}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-4"
                    >
                        <option value="all">All Status</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {user?.credentials.role === 'student' ? 'Tutor' : 'Student'}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Language & Duration
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredLessons.map((lesson) => (
                                <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {getParticipantInfo(lesson)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {lesson.language}
                                            <div className="text-xs text-gray-500">
                                                {lesson.duration} minutes
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Tooltip title={formatDateTime(lesson.start_time)}>
                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                {getTimeStatus(lesson)}
                                            </div>
                                        </Tooltip>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getLessonStatusBadge(lesson.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            ${lesson.price.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {renderActionButtons(lesson)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLessons.length === 0 && (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span className="text-gray-500 dark:text-gray-400">
                                {activeTab === 'upcoming'
                                    ? 'No upcoming lessons scheduled. Browse tutors to book a lesson!'
                                    : 'No past lessons found.'}
                            </span>
                        }
                    >
                        {activeTab === 'upcoming' && (
                            <button
                                onClick={() => navigate('/tutors')}
                                className="mt-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Find a Tutor
                            </button>
                        )}
                    </Empty>
                )}
            </div>
        </div>
    );
};

export default Lessons; 