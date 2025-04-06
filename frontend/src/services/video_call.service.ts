import { apiClient } from './api';
import { VideoCallSessionResponse, VideoCallEventRequest, VideoCallEventType } from '../types/lesson';

// Initialize a video call session for a lesson
export const initializeVideoSession = async (lessonId: number): Promise<VideoCallSessionResponse> => {
  const response = await apiClient.post(`/api/video-call/lessons/${lessonId}/session`);
  return response.data;
};

// Log a video call event
export const logVideoCallEvent = async (lessonId: number, eventType: VideoCallEventType, eventData?: Record<string, any>): Promise<void> => {
  const data: VideoCallEventRequest = {
    event_type: eventType,
    event_data: eventData,
  };
  await apiClient.post(`/api/video-call/lessons/${lessonId}/events`, data);
}; 