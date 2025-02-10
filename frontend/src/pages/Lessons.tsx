import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { message, notification } from 'antd';

interface Lesson {
    id: number;
    student_id: number;
    tutor_id: number;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    language: string;
    price: number;
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
                message: 'Error',
                description: 'Failed to load lessons. Please try again later.',
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500 dark:text-gray-400">Loading lessons...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lessons</h1>
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
                                    Language
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
                                <tr key={lesson.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {user?.credentials.role === 'student'
                                                ? lesson.tutor_name
                                                : lesson.student_name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {lesson.language}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {formatDateTime(lesson.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getLessonStatusBadge(lesson.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            ${lesson.price}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {isLessonJoinable(lesson) ? (
                                            <button
                                                onClick={() => handleJoinLesson(lesson.id)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                Join Lesson
                                            </button>
                                        ) : lesson.status === 'scheduled' ? (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Starts in {formatTime(lesson.start_time)}
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLessons.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">
                            {activeTab === 'upcoming'
                                ? 'No upcoming lessons scheduled'
                                : 'No past lessons found'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Lessons; 