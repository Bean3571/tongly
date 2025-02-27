import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface TutorProfile {
  id: string;
  name: string;
  bio: string;
  education: string;
  languages: string[];
  hourlyRate: number;
  rating: number;
  totalLessons: number;
  avatarUrl: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

const TutorProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTutorProfile = async () => {
      try {
        const response = await fetch(`/api/tutors/${id}`);
        const data = await response.json();
        setTutor(data);
        setSelectedLanguage(data.languages[0]);
      } catch (error) {
        console.error('Error loading tutor profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTutorProfile();
  }, [id]);

  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      try {
        const response = await fetch(
          `/api/tutors/${id}/availability?date=${selectedDate.toISOString()}`
        );
        const data = await response.json();
        setTimeSlots(data);
      } catch (error) {
        console.error('Error loading time slots:', error);
      }
    };

    if (selectedDate) {
      loadAvailableTimeSlots();
    }
  }, [id, selectedDate]);

  const handleBookLesson = async () => {
    if (!selectedTimeSlot || !selectedLanguage) return;

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: id,
          timeSlotId: selectedTimeSlot,
          language: selectedLanguage,
        }),
      });

      if (response.ok) {
        const lesson = await response.json();
        navigate(`/lessons/${lesson.id}`);
      }
    } catch (error) {
      console.error('Error booking lesson:', error);
    }
  };

  if (loading) {
    return <LoadingContainer>Loading...</LoadingContainer>;
  }

  if (!tutor) {
    return <ErrorContainer>Tutor not found</ErrorContainer>;
  }

    return (
    <Container>
      <ProfileSection>
        <AvatarSection>
          <Avatar src={tutor.avatarUrl} alt={tutor.name} />
          <TotalLessons>{tutor.totalLessons} lessons</TotalLessons>
        </AvatarSection>

        <InfoSection>
          <Name>{tutor.name}</Name>
          <HourlyRate>${tutor.hourlyRate}/hour</HourlyRate>
          <Languages>
            {tutor.languages.map(lang => (
              <LanguageTag key={lang}>{lang}</LanguageTag>
            ))}
          </Languages>
          <Bio>{tutor.bio}</Bio>
          <Education>
            <h3>Education</h3>
            <p>{tutor.education}</p>
          </Education>
        </InfoSection>
      </ProfileSection>

      <BookingSection>
        <h2>Book a Lesson</h2>
        <LanguageSelect
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
        >
          {tutor.languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </LanguageSelect>

        <CalendarWrapper>
          <Calendar
            onChange={(value, event) => {
              if (value instanceof Date) {
                setSelectedDate(value);
              }
            }}
            value={selectedDate}
            minDate={new Date()}
          />
        </CalendarWrapper>

        <TimeSlotGrid>
          {timeSlots.map(slot => (
            <TimeSlotButton
              key={slot.id}
              disabled={!slot.isAvailable}
              selected={selectedTimeSlot === slot.id}
              onClick={() => setSelectedTimeSlot(slot.id)}
            >
              {new Date(slot.startTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </TimeSlotButton>
          ))}
        </TimeSlotGrid>

        <BookButton
          disabled={!selectedTimeSlot || !selectedLanguage}
          onClick={handleBookLesson}
        >
          Book Lesson
        </BookButton>
      </BookingSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
  font-size: 1.2rem;
  color: #666;
`;

const ErrorContainer = styled(LoadingContainer)`
  color: #dc3545;
`;

const ProfileSection = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const AvatarSection = styled.div`
  text-align: center;
`;

const Avatar = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 1rem;
`;

const TotalLessons = styled.div`
  color: #6c757d;
`;

const InfoSection = styled.div`
  flex: 1;
`;

const Name = styled.h1`
  margin: 0 0 1rem;
  color: #212529;
`;

const HourlyRate = styled.div`
  font-size: 1.5rem;
  color: #28a745;
  margin-bottom: 1rem;
`;

const Languages = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const LanguageTag = styled.span`
  background: #e9ecef;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #495057;
`;

const Bio = styled.p`
  color: #495057;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`;

const Education = styled.div`
  h3 {
    color: #212529;
    margin-bottom: 0.5rem;
  }

  p {
    color: #495057;
    line-height: 1.6;
  }
`;

const BookingSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0 0 1.5rem;
    color: #212529;
  }
`;

const LanguageSelect = styled.select`
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  color: #495057;
`;

const CalendarWrapper = styled.div`
  margin-bottom: 1.5rem;

  .react-calendar {
    width: 100%;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-family: inherit;
  }
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

interface TimeSlotButtonProps {
  selected?: boolean;
}

const TimeSlotButton = styled.button<TimeSlotButtonProps>`
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: ${props => props.selected ? '#4a90e2' : 'white'};
  color: ${props => props.selected ? 'white' : '#495057'};
  cursor: pointer;

  &:disabled {
    background: #e9ecef;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: ${props => props.selected ? '#357abd' : '#f8f9fa'};
  }
`;

const BookButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;

  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #218838;
  }
`;

export default TutorProfilePage; 