import axios from 'axios';
import { TutorProfile, TutorAvailability } from '../types/tutor';
import { LessonBookingRequest } from '../types/lesson';
import { apiClient } from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const getTutorProfile = async (tutorId: string): Promise<TutorProfile> => {
  const response = await axios.get(`${API_URL}/tutors/${tutorId}`);
  return response.data;
};

export const getTutorAvailabilities = async (tutorId: string): Promise<TutorAvailability[]> => {
  const response = await axios.get(`${API_URL}/tutors/${tutorId}/availabilities`);
  return response.data;
};

export const bookLesson = async (bookingData: LessonBookingRequest): Promise<any> => {
  // apiClient automatically adds the auth token from localStorage
  const response = await apiClient.post('/api/lessons', bookingData);
  return response.data;
}; 