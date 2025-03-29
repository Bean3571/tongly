import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import TutorCard from '../components/TutorCard';

interface Tutor {
  id: string;
  name: string;
  languages: string[];
  rating: number;
  avatarUrl: string;
  shortBio: string;
  credentials?: {
    id: number;
  };
}

interface FilterState {
  language: string;
  minRating: number;
  searchQuery: string;
}

const TutorSearch: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    language: '',
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
          rating: parseFloat(tutor.tutor?.rating) || 0,
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
      
     
    } finally {
      setLoading(false);
    }
  };

  // Apply filters client-side for now
  const filteredTutors = tutors.filter(tutor => {
    const matchesLanguage = !filters.language || tutor.languages.includes(filters.language);
    const matchesRating = tutor.rating >= filters.minRating;
    const matchesSearch = !filters.searchQuery || 
      tutor.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      tutor.shortBio.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
      tutor.languages.some(lang => lang.toLowerCase().includes(filters.searchQuery.toLowerCase()));

    return matchesLanguage && matchesRating && matchesSearch;
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
        <div className="text-gray-500">Loading tutors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Tutor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, language, or bio..."
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={filters.language}
                onChange={(e) => handleFilterChange('language', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">All Languages</option>
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-orange-500 focus:border-orange-500"
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
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">
                No tutors found matching your criteria. Try adjusting your filters.
              </p>
            </div>
          ) : (
            filteredTutors.map(tutor => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSearch;