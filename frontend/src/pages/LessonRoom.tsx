import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/I18nContext';
import { Button } from '../components/ui/Button';
import { lessonService, RoomParticipant } from '../services/api';
import { Lesson } from '../types/lesson';
import { useNotification } from '../contexts/NotificationContext';
import { Box, Typography, List, ListItem, ListItemAvatar, ListItemText, Avatar, Paper } from '@mui/material';
import axios from 'axios';

const LessonRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);

  useEffect(() => {
    const fetchLessonAndJoinRoom = async () => {
      try {
        if (!lessonId) {
          console.error('No lesson ID provided');
          showNotification('error', t('lessons.errors.invalid.id'));
          navigate('/lessons');
          return;
        }

        console.log('Fetching lesson details for lesson:', lessonId);
        // Get lesson details
        const lessonData = await lessonService.getLesson(Number(lessonId));
        console.log('Lesson details:', lessonData);
        setLesson(lessonData);

        console.log('Joining lesson room:', lessonId);
        // Join the room
        try {
          const roomInfo = await lessonService.joinLesson(Number(lessonId));
          console.log('Successfully joined room. Room info:', roomInfo);
          setParticipants(roomInfo.participants);
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Failed to join room:', {
              status: error.response?.status,
              data: error.response?.data,
              message: error.message
            });
            const errorMessage = error.response?.data?.error || t('lessons.errors.join.room');
            showNotification('error', errorMessage);
          } else {
            console.error('Unexpected error joining room:', error);
            showNotification('error', t('lessons.errors.join.room'));
          }
          navigate('/lessons');
          return;
        }

        // Start polling for participants
        console.log('Starting participant polling for lesson:', lessonId);
        const pollInterval = setInterval(async () => {
          try {
            const roomData = await lessonService.getRoomInfo(Number(lessonId));
            console.log('Updated participants:', roomData.participants);
            setParticipants(roomData.participants);
          } catch (error) {
            console.error('Error polling room info:', error);
          }
        }, 5000);

        return () => {
          console.log('Cleaning up room connection');
          clearInterval(pollInterval);
          // Leave room when component unmounts
          lessonService.leaveLesson(Number(lessonId))
            .catch(error => console.error('Error leaving room during cleanup:', error));
        };
      } catch (error) {
        console.error('Error in room setup:', error);
        if (axios.isAxiosError(error)) {
          const errorMessage = error.response?.data?.error || t('lessons.errors.join.room');
          showNotification('error', errorMessage);
        } else {
          showNotification('error', t('lessons.errors.join.room'));
        }
        navigate('/lessons');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonAndJoinRoom();
  }, [lessonId, navigate, showNotification, t]);

  const handleLeaveRoom = async () => {
    try {
      console.log('Leaving room:', lessonId);
      await lessonService.leaveLesson(Number(lessonId));
      console.log('Successfully left room');
      navigate('/lessons');
    } catch (error) {
      console.error('Error leaving room:', error);
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error || t('lessons.errors.leave.room');
        showNotification('error', errorMessage);
      } else {
        showNotification('error', t('lessons.errors.leave.room'));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('lessons.room.title')}</Typography>
        <Button onClick={handleLeaveRoom} variant="outline" color="error">
          {t('lessons.room.leave')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 2, mb: 2, minHeight: '400px' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('lessons.room.participants')}
            </Typography>
            <List>
              {participants.map((participant) => (
                <ListItem key={participant.id}>
                  <ListItemAvatar>
                    <Avatar src={participant.avatar_url || undefined} alt={participant.username}>
                      {participant.first_name?.[0] || participant.username[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${participant.first_name || ''} ${participant.last_name || ''}`}
                    secondary={participant.username}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default LessonRoom; 