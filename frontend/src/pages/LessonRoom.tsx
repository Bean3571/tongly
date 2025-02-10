import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import VideoRoom from '../components/VideoRoom';
import LessonChat from '../components/LessonChat';

interface Participant {
  id: number;
  name: string;
  role: 'student' | 'tutor';
}

interface LessonDetails {
  id: number;
  startTime: string;
  endTime: string;
  status: string;
  language: string;
  student: Participant;
  tutor: Participant;
}

interface TimerProps {
  warning: boolean;
}

const LessonRoom: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    loadLessonDetails();
  }, [lessonId]);

  useEffect(() => {
    if (lesson) {
      const timer = setInterval(updateTimeRemaining, 1000);
      return () => clearInterval(timer);
    }
  }, [lesson]);

  const loadLessonDetails = async () => {
    try {
      const response = await fetch(`/api/lessons/${lessonId}`);
      if (!response.ok) {
        throw new Error('Failed to load lesson details');
      }

      const data = await response.json();
      setLesson(data);
      updateTimeRemaining();
    } catch (error) {
      setError('Failed to load lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimeRemaining = () => {
    if (lesson) {
      const endTime = new Date(lesson.endTime).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      // Show warning when 10 minutes remaining
      if (remaining <= 10 * 60 * 1000 && remaining > 0 && !showWarning) {
        setShowWarning(true);
        showTimeWarning();
      }

      // Redirect when lesson ends
      if (remaining <= 0) {
        handleLessonEnd();
      }
    }
  };

  const showTimeWarning = () => {
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification('10 minutes remaining', {
        body: 'Your lesson will end in 10 minutes.',
        icon: '/logo.png',
      });
    }
  };

  const handleLessonEnd = async () => {
    try {
      // End video session
      await fetch(`/api/lessons/${lessonId}/video/end`, {
        method: 'POST',
      });

      // Redirect to rating page
      navigate(`/lessons/${lessonId}/rate`);
    } catch (error) {
      console.error('Error ending lesson:', error);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <LoadingContainer>Loading lesson room...</LoadingContainer>;
  }

  if (error || !lesson) {
    return <ErrorContainer>{error}</ErrorContainer>;
  }

  const participants = [
    lesson.student,
    lesson.tutor,
  ];

  const currentUser = lesson.student; // In a real app, get from auth context

  return (
    <Container>
      <Header>
        <LessonInfo>
          <Title>{`${lesson.language} Lesson`}</Title>
          <Subtitle>
            {`with ${lesson.tutor.name}`}
          </Subtitle>
        </LessonInfo>
        <Timer warning={timeRemaining <= 10 * 60 * 1000}>
          {formatTimeRemaining(timeRemaining)}
        </Timer>
      </Header>

      <Content>
        <VideoSection>
          <VideoRoom
            lessonId={parseInt(lessonId!, 10)}
            userId={currentUser.id}
          />
        </VideoSection>

        <ChatSection>
          <LessonChat
            lessonId={parseInt(lessonId!, 10)}
            userId={currentUser.id}
            participants={participants}
          />
        </ChatSection>
      </Content>

      {showWarning && (
        <WarningBanner>
          10 minutes remaining in your lesson
        </WarningBanner>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const LessonInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
`;

const Subtitle = styled.div`
  color: #666;
  font-size: 1rem;
`;

const Timer = styled.div<TimerProps>`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${(props: TimerProps) => props.warning ? '#e74c3c' : '#2c3e50'};
  transition: color 0.3s;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1rem;
  height: calc(100vh - 80px);
`;

const VideoSection = styled.div`
  flex: 1;
  min-width: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const ChatSection = styled.div`
  width: 350px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
`;

const WarningBanner = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #e74c3c;
  color: white;
  text-align: center;
  padding: 0.5rem;
  animation: slideDown 0.5s ease-out;

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.2rem;
  color: #e74c3c;
`;

export default LessonRoom; 