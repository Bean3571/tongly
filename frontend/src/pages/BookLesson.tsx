import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

interface TutorDetails {
  credentials: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  personal: {
    first_name: string;
    last_name: string;
  };
  tutor: {
    teaching_languages: Array<{ language: string }> | null;
    hourly_rate: number;
    bio: string;
  };
}

export const BookLesson: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [tutor, setTutor] = useState<TutorDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [duration, setDuration] = useState<number>(45); // Duration in minutes

  useEffect(() => {
    loadTutorDetails();
  }, [id]);

  const loadTutorDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/tutors', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load tutor details');
      const data = await response.json();
      
      const tutorData = data.tutors?.find((t: TutorDetails) => t.credentials.id.toString() === id);
      if (!tutorData) throw new Error('Tutor not found');
      
      setTutor(tutorData);
      
      if (tutorData.tutor?.teaching_languages?.length > 0) {
        setSelectedLanguage(tutorData.tutor.teaching_languages[0].language);
      } else {
        setSelectedLanguage('English');
      }
    } catch (error) {
      console.error('Error loading tutor details:', error);
      showNotification('error', 'Failed to load tutor details');
      navigate('/tutors');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));
    return { hours, minutes };
  };

  const handleBookLesson = async () => {
    try {
      if (!tutor) {
        throw new Error('Tutor information not available');
      }

      if (!selectedHour || !selectedMinute) {
        throw new Error('Please select a valid time');
      }

      const token = localStorage.getItem('token');
      const startDateTime = new Date(selectedDate);
      startDateTime.setHours(parseInt(selectedHour, 10), parseInt(selectedMinute, 10), 0, 0);

      // Validate that the selected time is in the future
      if (startDateTime <= new Date()) {
        throw new Error('Please select a future date and time');
      }

      // Calculate end time
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      const requestData = {
        tutor_id: parseInt(id!, 10),
        start_time: startDateTime.toISOString(),
        language: selectedLanguage,
        duration: duration,
      };

      console.log('Booking lesson with data:', requestData);

      const response = await fetch('http://localhost:8080/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (!response.ok) {
        let errorMessage = 'Failed to book lesson';
        try {
          const errorData = JSON.parse(responseData);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      showNotification('success', 'Lesson booked successfully!');
      navigate('/lessons');
    } catch (error) {
      console.error('Error booking lesson:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to book lesson. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-500">Tutor not found</div>
      </div>
    );
  }

  const tutorName = `${tutor.personal?.first_name || ''} ${tutor.personal?.last_name || ''}`.trim() || tutor.credentials?.username;
  const languages = tutor.tutor?.teaching_languages?.map(lang => lang.language) || ['English'];
  const { hours, minutes } = generateTimeOptions();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Book a Lesson with {tutorName}</h1>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Select Language</label>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Select Time</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Hour</label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Hour</option>
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Minute</label>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Minute</option>
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>
                    :{minute}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lesson Duration</label>
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full p-2 border rounded"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>

        <div className="mt-4 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-200">Lesson Details</h3>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            • Duration: {duration} minutes<br />
            • Price: ${((tutor.tutor?.hourly_rate || 25) * (duration / 60)).toFixed(2)}<br />
            • Language: {selectedLanguage}<br />
            {selectedHour && selectedMinute && `• Time: ${selectedDate.toLocaleDateString()} at ${selectedHour}:${selectedMinute}`}
          </p>
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate('/tutors')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleBookLesson}
            disabled={!selectedLanguage || !selectedHour || !selectedMinute}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Book Lesson
          </button>
        </div>
      </div>
    </div>
  );
}; 