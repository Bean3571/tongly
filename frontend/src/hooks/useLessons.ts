import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import { api } from '../api/client';
import { envConfig } from '@/config/env';

export interface Lesson {
    id: number;
    student_id: number;
    tutor_id: number;
    start_time: string;
    end_time: string;
    cancelled: boolean;
    language: string;
    duration: number;
    tutor_name?: string;
    student_name?: string;
}

export interface UseLessonsProps {
    type: 'all' | 'scheduled' | 'past' | 'cancelled';
    autoRefresh?: boolean;
}

// Helper to get current time, using mock time in development if lesson dates are far in future
const getCurrentTime = (lessonStartTime: string): Date => {
    const now = new Date();
    const startTime = new Date(lessonStartTime);
    
    // If we're in development and the lesson is more than a year in the future
    if (envConfig.environment === 'development' && startTime.getTime() - now.getTime() > 365 * 24 * 60 * 60 * 1000) {
        // Use a time 5 minutes after the lesson start for testing
        return new Date(startTime.getTime() + 5 * 60 * 1000);
    }
    
    return now;
};

export const useLessons = ({ type, autoRefresh = false }: UseLessonsProps) => {
    const navigate = useNavigate();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isLoadingRef = useRef(false); // Prevent concurrent requests
    const abortControllerRef = useRef<AbortController | null>(null);

    const loadLessons = useCallback(async (silent = false) => {
        // Prevent concurrent requests
        if (isLoadingRef.current) {
            console.log('Already loading lessons, skipping request');
            return;
        }

        // Cancel any in-flight requests
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();
        
        try {
            isLoadingRef.current = true;
            if (!silent) setLoading(true);
            setError(null);

            console.log(`Fetching lessons...`);
            
            // Get lessons using the updated API
            let lessonsData: any;
            const now = new Date();
            
            // Use status query parameter based on the type
            switch (type) {
                case 'scheduled':
                    // Use upcoming status for scheduled lessons
                    lessonsData = await api.lessons.getUpcoming();
                    break;
                case 'past':
                    // Use completed status for past lessons
                    lessonsData = await api.lessons.getCompleted();
                    break;
                case 'cancelled':
                    // Get all lessons and filter client-side for cancelled
                    lessonsData = await api.lessons.getAll();
                    break;
                default:
                    // Get all lessons
                    lessonsData = await api.lessons.getAll();
            }
            
            console.log('Lessons API Response:', lessonsData);

            if (!lessonsData) {
                throw new Error('No data received from server');
            }

            // Ensure we're working with an array
            const lessonsArray = Array.isArray(lessonsData) ? lessonsData : [lessonsData];
            
            // Filter lessons based on the requested type if the backend doesn't already filter
            const filteredLessons = lessonsArray.filter((lesson): lesson is Lesson => {
                if (!lesson || typeof lesson !== 'object') {
                    console.error('Invalid lesson data:', lesson);
                    return false;
                }
                
                if (typeof lesson.id !== 'number') {
                    return false;
                }
                
                // Additional filtering for cancelled lessons, as the backend API doesn't have a cancelled filter
                if (type === 'cancelled') {
                    return lesson.cancelled;
                }
                
                return true;
            });

            console.log('Filtered lessons:', filteredLessons);
            setLessons(filteredLessons);
        } catch (error: any) {
            // Don't update state if request was aborted
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            
            console.error('Error loading lessons:', {
                error,
                response: error?.response,
                message: error?.message,
                stack: error?.stack
            });
            
            const message = error?.response?.data?.message || error?.message || 'Failed to load lessons';
            setError(message);
            
            if (!silent) {
                notification.error({
                    message: 'Error Loading Lessons',
                    description: message,
                });
            }

            // If unauthorized, redirect to login
            if (error?.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            isLoadingRef.current = false;
            if (!silent) setLoading(false);
        }
    }, [type, navigate]);

    const cancelLesson = async (lessonId: number, reason: string) => {
        try {
            // Use the updated API with DELETE method
            await api.lessons.cancel(lessonId, reason);

            notification.success({
                message: 'Lesson Cancelled',
                description: 'The lesson has been successfully cancelled.',
            });

            // Update the local state to show the lesson as cancelled
            setLessons(prevLessons =>
                prevLessons.map(lesson =>
                    lesson.id === lessonId
                        ? { ...lesson, cancelled: true }
                        : lesson
                )
            );

            // Reload lessons to update the list
            loadLessons();
        } catch (error: any) {
            console.error('Error cancelling lesson:', error);
            const message = error?.response?.data?.message || error?.message || 'Failed to cancel lesson';
            notification.error({
                message: 'Error',
                description: message,
            });
            
            // If unauthorized, redirect to login
            if (error?.response?.status === 401) {
                navigate('/login');
            }
            throw error;
        }
    };

    // Set up auto-refresh if enabled
    useEffect(() => {
        // Clear any existing interval
        if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
        }
        
        if (autoRefresh) {
            // Refresh every 30 seconds if auto-refresh is enabled, but use silent loading
            refreshIntervalRef.current = setInterval(() => {
                loadLessons(true); // Silent refresh
            }, 30000);
        }
        
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [autoRefresh, loadLessons]);

    // Initial load
    useEffect(() => {
        loadLessons();
        
        return () => {
            // Clean up on unmount
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [type, loadLessons]);

    return {
        lessons,
        loading,
        error,
        refreshLessons: () => loadLessons(false),
        cancelLesson,
    };
}; 