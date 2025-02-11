import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Button, Space, Empty, notification } from 'antd';
import { LessonStatusBadge } from './LessonStatusBadge';
import { Lesson } from '../../hooks/useLessons';
import { formatDateTime, getTimeStatus, getHoursUntilStart } from '../../utils/dateUtils';

interface LessonListProps {
    lessons: Lesson[];
    userRole: string;
    onCancelLesson: (lesson: Lesson) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ lessons, userRole, onCancelLesson }) => {
    const navigate = useNavigate();

    const handleJoinLesson = async (lessonId: number) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                notification.error({
                    message: 'Authentication Error',
                    description: 'Please log in again to continue.',
                });
                navigate('/login');
                return;
            }

            // First check if the lesson exists and is in a valid state
            const lessonResponse = await fetch(`http://localhost:8080/api/lessons/${lessonId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!lessonResponse.ok) {
                throw new Error('Failed to verify lesson status');
            }

            const lessonData = await lessonResponse.json();
            
            // Only allow joining if the lesson is scheduled
            if (lessonData.status !== 'scheduled') {
                throw new Error('This lesson cannot be joined at this time');
            }
            
            // Check if lesson can be joined
            const now = new Date();
            const startTime = new Date(lessonData.start_time);
            const endTime = new Date(lessonData.end_time);
            const joinWindow = new Date(startTime.getTime() - 5 * 60 * 1000); // 5 minutes before start
            
            if (now < joinWindow) {
                notification.warning({
                    message: 'Too Early',
                    description: 'You can join the lesson 5 minutes before the scheduled start time.',
                });
                return;
            }

            if (now > endTime) {
                throw new Error('This lesson has already ended');
            }

            // Try to get existing video session
            const sessionResponse = await fetch(`http://localhost:8080/api/lessons/${lessonId}/video`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            let videoSession;
            
            if (sessionResponse.status === 404) {
                // No existing session, create a new one
                const startResponse = await fetch(`http://localhost:8080/api/lessons/${lessonId}/video/start`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!startResponse.ok) {
                    const errorData = await startResponse.json();
                    throw new Error(errorData.error || 'Failed to start video session');
                }

                videoSession = await startResponse.json();
            } else if (sessionResponse.ok) {
                videoSession = await sessionResponse.json();
            } else {
                throw new Error('Failed to check video session status');
            }

            // Navigate to the lesson room with the session info
            navigate(`/lessons/${lessonId}`, {
                state: { videoSession }
            });

        } catch (error) {
            console.error('Error joining lesson:', error);
            
            let errorMessage = 'Failed to join lesson';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            notification.error({
                message: 'Error Joining Lesson',
                description: errorMessage,
                duration: 5,
            });
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
            
            // Only allow joining scheduled lessons
            if (lesson.status !== 'scheduled') {
                return false;
            }
            
            // Allow joining 5 minutes before start time and until end time
            const joinWindow = new Date(startTime.getTime() - 5 * 60 * 1000);
            return now >= joinWindow && now <= endTime;
        } catch (error) {
            console.error('Error checking if lesson is joinable:', error);
            return false;
        }
    };

    const getParticipantInfo = (lesson: Lesson) => {
        const name = userRole === 'student' ? lesson.tutor_name : lesson.student_name;
        const defaultName = userRole === 'student' ? 'Tutor' : 'Student';
        return name || defaultName;
    };

    const renderActionButtons = (lesson: Lesson) => {
        const now = new Date();
        const startTime = new Date(lesson.start_time);
        const endTime = new Date(lesson.end_time);
        const hoursUntilStart = getHoursUntilStart(lesson.start_time);

        // Show Join button if lesson is joinable
        if (isLessonJoinable(lesson)) {
            const isInProgress = now >= startTime && now <= endTime;
            return (
                <Button
                    type="primary"
                    onClick={() => handleJoinLesson(lesson.id)}
                    className={isInProgress ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                    {isInProgress ? 'Join Ongoing Lesson' : 'Join Lesson'}
                </Button>
            );
        }

        // Show countdown or cancel button for scheduled lessons
        if (lesson.status === 'scheduled') {
            return (
                <Space>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getTimeStatus(lesson.start_time, lesson.status)}
                    </div>
                    {hoursUntilStart > 24 && (
                        <Button
                            danger
                            onClick={() => onCancelLesson(lesson)}
                        >
                            Cancel
                        </Button>
                    )}
                </Space>
            );
        }

        // Show status for completed or cancelled lessons
        if (lesson.status === 'completed' || lesson.status === 'cancelled') {
            return (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
                </div>
            );
        }

        return null;
    };

    if (lessons.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No lessons found"
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {userRole === 'student' ? 'Tutor' : 'Student'}
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
                    {lessons.map((lesson) => (
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
                                        {getTimeStatus(lesson.start_time, lesson.status)}
                                    </div>
                                </Tooltip>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <LessonStatusBadge status={lesson.status} />
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
    );
}; 