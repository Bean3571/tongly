import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tooltip, Button, Space, Empty, notification, Spin } from 'antd';
import { LessonStatusBadge } from './LessonStatusBadge';
import { Lesson } from '../../hooks/useLessons';
import { formatDateTime, getTimeStatus, getHoursUntilStart } from '../../utils/dateUtils';
import { useTranslation } from '../../contexts/I18nContext';
import { api } from '../../utils/api';

interface LessonListProps {
    lessons: Lesson[];
    userRole: string;
    onCancelLesson: (lesson: Lesson) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ lessons, userRole, onCancelLesson }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [joiningLesson, setJoiningLesson] = useState<number | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);

    const handleJoinLesson = async (lessonId: number) => {
        try {
            setJoiningLesson(lessonId);
            setJoinError(null);
            
            console.log(`Attempting to join lesson ${lessonId}...`);
            
            // First check if the lesson exists and is in a valid state
            const response = await api.get(`/lessons/${lessonId}`);
            if (!response || !response.data) {
                throw new Error('Failed to retrieve lesson data');
            }
            
            const lessonData = response.data;
            console.log('Lesson data:', lessonData);
            
            // Allow joining if the lesson is scheduled or in progress
            if (lessonData.status !== 'scheduled' && lessonData.status !== 'in_progress') {
                throw new Error(t('lessons.error.cannot.join'));
            }
            
            // Check if lesson can be joined
            const now = new Date();
            const startTime = new Date(lessonData.start_time);
            const endTime = new Date(lessonData.end_time);
            const joinWindow = new Date(startTime.getTime() - 5 * 60 * 1000);
            
            if (now < joinWindow) {
                notification.warning({
                    message: t('lessons.warning.too.early.title'),
                    description: t('lessons.warning.too.early.description'),
                });
                return;
            }

            if (now > endTime) {
                throw new Error(t('lessons.error.ended'));
            }

            // Try to get existing video session
            try {
                console.log('Checking for existing video session...');
                const videoResponse = await api.get(`/lessons/${lessonId}/video`);
                if (!videoResponse || !videoResponse.data) {
                    throw new Error('No video session data received');
                }
                
                console.log('Found existing video session:', videoResponse.data);
                navigate(`/lessons/${lessonId}/room`, { state: { videoSession: videoResponse.data } });
            } catch (error: any) {
                console.log('Error getting video session:', error);
                
                if (error.response?.status === 404) {
                    // No existing session, create a new one
                    console.log('Creating new video session...');
                    const createResponse = await api.post(`/lessons/${lessonId}/video/start`);
                    if (!createResponse || !createResponse.data) {
                        throw new Error('Failed to create video session');
                    }
                    
                    console.log('Created new video session:', createResponse.data);
                    navigate(`/lessons/${lessonId}/room`, { state: { videoSession: createResponse.data } });
                } else {
                    throw new Error(
                        error.response?.data?.message || 
                        t('lessons.error.check.session')
                    );
                }
            }
        } catch (error) {
            console.error('Error joining lesson:', error);
            
            let errorMessage = t('lessons.error.join.default');
            if (error instanceof Error) {
                errorMessage = error.message;
                setJoinError(errorMessage);
            }
            
            notification.error({
                message: t('lessons.error.join.title'),
                description: errorMessage,
                duration: 5,
            });
        } finally {
            setJoiningLesson(null);
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
            
            // Allow joining scheduled and in-progress lessons
            if (lesson.status !== 'scheduled' && lesson.status !== 'in_progress') {
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
        const defaultName = userRole === 'student' ? t('lessons.participant.tutor') : t('lessons.participant.student');
        return name || defaultName;
    };

    const renderActionButtons = (lesson: Lesson) => {
        const now = new Date();
        const startTime = new Date(lesson.start_time);
        const endTime = new Date(lesson.end_time);
        const hoursUntilStart = getHoursUntilStart(lesson.start_time);
        const isCurrentlyJoining = joiningLesson === lesson.id;

        // Show Join button if lesson is joinable
        if (isLessonJoinable(lesson)) {
            const isInProgress = now >= startTime && now <= endTime;
            return (
                <Button
                    type="primary"
                    onClick={() => handleJoinLesson(lesson.id)}
                    loading={isCurrentlyJoining}
                    className={isInProgress ? 'bg-green-600 hover:bg-green-700' : ''}
                    disabled={isCurrentlyJoining}
                >
                    {isCurrentlyJoining 
                        ? t('lessons.actions.joining') 
                        : isInProgress 
                            ? t('lessons.actions.join.ongoing') 
                            : t('lessons.actions.join')
                    }
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
                            disabled={isCurrentlyJoining}
                        >
                            {t('lessons.actions.cancel')}
                        </Button>
                    )}
                </Space>
            );
        }

        // Show status for completed or cancelled lessons
        if (lesson.status === 'completed' || lesson.status === 'cancelled') {
            return (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`lessons.status.${lesson.status}`)}
                </div>
            );
        }

        return null;
    };

    if (lessons.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('lessons.empty')}
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            {joinError && (
                <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded">
                    <p className="font-medium">Error joining lesson:</p>
                    <p>{joinError}</p>
                </div>
            )}
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {userRole === 'student' ? t('lessons.table.tutor') : t('lessons.table.student')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lessons.table.language.duration')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lessons.table.date.time')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lessons.table.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lessons.table.price')}
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t('lessons.table.actions')}
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
                                        {t('lessons.duration', { minutes: lesson.duration })}
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
                                    {t('lessons.price', { price: lesson.price.toFixed(2) })}
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