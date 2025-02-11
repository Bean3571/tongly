import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';

export interface Lesson {
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

interface UseLessonsProps {
    type: 'upcoming' | 'completed';
}

export const useLessons = ({ type }: UseLessonsProps) => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLessons = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const apiUrl = 'http://localhost:8080/api';
            const endpoint = type === 'upcoming' ? '/lessons/upcoming' : '/lessons/completed';

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
            const message = error instanceof Error ? error.message : 'Failed to load lessons';
            setError(message);
            notification.error({
                message: 'Error Loading Lessons',
                description: message,
            });
        } finally {
            setLoading(false);
        }
    };

    const cancelLesson = async (lessonId: number, reason: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8080/api/lessons/${lessonId}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
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
            const message = error instanceof Error ? error.message : 'Failed to cancel lesson';
            notification.error({
                message: 'Error',
                description: message,
            });
            throw error;
        }
    };

    useEffect(() => {
        loadLessons();
    }, [type]);

    return {
        lessons,
        loading,
        error,
        refreshLessons: loadLessons,
        cancelLesson,
    };
}; 