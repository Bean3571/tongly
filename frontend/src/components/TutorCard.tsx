import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TutorCardProps {
  tutor: {
    id: string;
    name: string;
    languages: string[];
    hourlyRate: number;
    rating: number;
    totalLessons: number;
    avatarUrl: string;
    shortBio: string;
    credentials?: {
      id: number;
    };
  };
}

const TutorCard: React.FC<TutorCardProps> = ({ tutor }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-6">
        <img
          src={tutor.avatarUrl}
          alt={tutor.name}
          className="w-24 h-24 rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/default-avatar.png';
          }}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {tutor.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-yellow-400">⭐</span>
                <span className="text-gray-700">
                  {tutor.rating.toFixed(1)} ({tutor.totalLessons} lessons)
                </span>
              </div>
            </div>
            <div className="text-xl font-semibold text-orange-600">
              ${tutor.hourlyRate}/hr
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tutor.languages.map(lang => (
              <span
                key={lang}
                className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                {lang}
              </span>
            ))}
          </div>
          <p className="mt-3 text-gray-600 line-clamp-2">
            {tutor.shortBio}
          </p>
          <div className="mt-4 flex justify-end gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/tutors/${tutor.credentials?.id}/book`);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
            >
              Book Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorCard; 