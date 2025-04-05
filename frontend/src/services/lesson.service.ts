import { apiClient } from './api';
import { Lesson, LessonCancellationRequest } from '../types/lesson';

// Get all lessons for the current user
export const getUserLessons = async (): Promise<Lesson[]> => {
  const response = await apiClient.get('/api/lessons/user');
  return response.data;
};

// Get scheduled lessons for the current user
export const getScheduledLessons = async (): Promise<Lesson[]> => {
  const response = await apiClient.get('/api/lessons/user/scheduled');
  return response.data;
};

// Get past lessons for the current user
export const getPastLessons = async (): Promise<Lesson[]> => {
  const response = await apiClient.get('/api/lessons/user/past');
  return response.data;
};

// Get cancelled lessons for the current user
export const getCancelledLessons = async (): Promise<Lesson[]> => {
  const response = await apiClient.get('/api/lessons/user/cancelled');
  return response.data;
};

// Get a specific lesson by ID
export const getLessonById = async (lessonId: number): Promise<Lesson> => {
  const response = await apiClient.get(`/api/lessons/${lessonId}`);
  return response.data;
};

// Cancel a lesson
export const cancelLesson = async (lessonId: number, reason: string): Promise<void> => {
  const data: LessonCancellationRequest = { reason };
  await apiClient.post(`/api/lessons/${lessonId}/cancel`, data);
}; 