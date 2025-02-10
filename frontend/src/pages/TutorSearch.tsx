import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

interface Tutor {
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
}

interface FilterState {
  language: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  searchQuery: string;
}

// Mock data for development
const MOCK_TUTORS: Tutor[] = [
  {
    id: "1",
    name: "John Doe",
    languages: ["English", "Spanish"],
    hourlyRate: 25,
    rating: 4.8,
    totalLessons: 120,
    avatarUrl: "/default-avatar.png",
    shortBio: "Experienced English and Spanish tutor with 5+ years of teaching experience.",
    credentials: {
      id: 1,
    },
  },
  {
    id: "2",
    name: "Jane Smith",
    languages: ["French", "English"],
    hourlyRate: 30,
    rating: 4.9,
    totalLessons: 200,
    avatarUrl: "/default-avatar.png",
    shortBio: "Native French speaker with expertise in teaching beginners to advanced students.",
    credentials: {
      id: 2,
    },
  }
];

const TutorSearch: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    language: '',
    minPrice: 0,
    maxPrice: 200,
    minRating: 0,
    searchQuery: '',
  });

  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  useEffect(() => {
    loadTutors();
  }, []); // Only load on mount initially

  const loadTutors = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/tutors', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          showNotification('error', 'Please log in to view tutors');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to fetch tutors: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw tutor data:', data);
      
      // Get the tutors array from the response
      const tutorsArray = data.tutors || [];
      
      // Transform the data to match our interface, with more lenient defaults
      const transformedTutors: Tutor[] = tutorsArray.map((tutor: any) => {
        // Get the best available name
        const firstName = tutor.personal?.first_name || '';
        const lastName = tutor.personal?.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const username = tutor.credentials?.username || '';
        const displayName = fullName || username || 'New Tutor';

        return {
          id: tutor.credentials?.id?.toString() || '',
          name: displayName,
          languages: Array.isArray(tutor.tutor?.teaching_languages) 
            ? tutor.tutor.teaching_languages.map((lang: any) => lang.language || 'Unknown')
            : ['Not specified'],
          hourlyRate: parseFloat(tutor.tutor?.hourly_rate) || 25, // Default rate
          rating: parseFloat(tutor.tutor?.rating) || 0,
          totalLessons: parseInt(tutor.tutor?.total_lessons) || 0,
          avatarUrl: tutor.personal?.profile_picture || '/default-avatar.png',
          shortBio: tutor.tutor?.bio || 'This tutor has not added a bio yet.',
          credentials: tutor.credentials,
        };
      });

      console.log('Transformed tutors:', transformedTutors);

      // Only filter out tutors without an ID
      const validTutors = transformedTutors.filter(tutor => tutor.id);
      setTutors(validTutors);

      // Extract unique languages, including 'Not specified'
      const languages = new Set<string>();
      validTutors.forEach(tutor => {
        tutor.languages.forEach(lang => languages.add(lang));
      });
      setAvailableLanguages(Array.from(languages).sort());
    } catch (error) {
      console.error('Error loading tutors:', error);
      showNotification('error', 'Failed to load tutors. Please try again later.');
      
      // Only use mock data in development
      if (process.env.NODE_ENV === 'development') {
        setTutors(MOCK_TUTORS);
        const languages = new Set<string>();
        MOCK_TUTORS.forEach(tutor => {
          tutor.languages.forEach(lang => languages.add(lang));
        });
        setAvailableLanguages(Array.from(languages).sort());
      }
    } finally {
      setLoading(false);
    }
  };

  // Apply filters client-side for now
  const filteredTutors = tutors.filter(tutor => {
    const matchesLanguage = !filters.language || tutor.languages.includes(filters.language);
    const matchesPrice = tutor.hourlyRate >= filters.minPrice && 
                        (filters.maxPrice === 0 || tutor.hourlyRate <= filters.maxPrice);
    const matchesRating = tutor.rating >= filters.minRating;
    const matchesSearch = !filters.searchQuery || 
      tutor.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      tutor.shortBio.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      tutor.languages.some(lang => lang.toLowerCase().includes(filters.searchQuery.toLowerCase()));

    return matchesLanguage && matchesPrice && matchesRating && matchesSearch;
  });

  const handleFilterChange = (name: keyof FilterState, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-gray-500 dark:text-gray-400">Loading tutors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Find Your Perfect Tutor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Section */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, language, or bio..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Languages</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Range ($/hour)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min="0"
                  max={filters.maxPrice}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  min={filters.minPrice}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="0">Any Rating</option>
                <option value="4.5">4.5+ ⭐</option>
                <option value="4">4.0+ ⭐</option>
                <option value="3.5">3.5+ ⭐</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3 space-y-6">
          {filteredTutors.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No tutors found matching your criteria. Try adjusting your filters.
              </p>
            </div>
          ) : (
            filteredTutors.map(tutor => (
              <div
                key={tutor.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
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
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {tutor.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {tutor.rating.toFixed(1)} ({tutor.totalLessons} lessons)
                          </span>
                        </div>
                      </div>
                      <div className="text-xl font-semibold text-green-600 dark:text-green-400">
                        ${tutor.hourlyRate}/hr
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tutor.languages.map(lang => (
                        <span
                          key={lang}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-gray-600 dark:text-gray-300 line-clamp-2">
                      {tutor.shortBio}
                    </p>
                    <div className="mt-4 flex justify-end gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tutors/${tutor.credentials?.id}/profile`);
                        }}
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tutors/${tutor.credentials?.id}/book`);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                      >
                        Book Lesson
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSearch;