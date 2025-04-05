import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { TutorCard } from '../components/TutorCard';
import { TutorProfile, TutorSearchFilters } from '../types/tutor';
import { Language, LanguageProficiency } from '../types/language';
import { Interest, Goal } from '../types/interest-goal';
import { UserRole } from '../types/user';
import { 
  getErrorMessage, 
  tutorService, 
  languageService, 
  interestService, 
  goalService 
} from '../services/api';

export const SearchTutor = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // State for filter options
  const [languages, setLanguages] = useState<Language[]>([]);
  const [proficiencies, setProficiencies] = useState<LanguageProficiency[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // State for selected filters
  const [filters, setFilters] = useState<TutorSearchFilters>({});
  const [activeFilters, setActiveFilters] = useState<number>(0);
  
  // State for tutors
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Mobile layout handling
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Check screen size and update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setFiltersVisible(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect if not a student
  useEffect(() => {
    if (user && user.role !== UserRole.STUDENT) {
      navigate('/');
    }
  }, [user, navigate]);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [languagesData, proficienciesData, interestsData, goalsData] = await Promise.all([
          languageService.getAllLanguages(),
          languageService.getAllProficiencies(),
          interestService.getAllInterests(),
          goalService.getAllGoals()
        ]);

        setLanguages(languagesData);
        setProficiencies(proficienciesData);
        setInterests(interestsData);
        setGoals(goalsData);
      } catch (error) {
        setError(getErrorMessage(error));
      }
    };

    loadFilters();
  }, []);

  // Update active filters count
  useEffect(() => {
    let count = 0;
    if (filters.languages && filters.languages.length > 0) count++;
    if (filters.proficiency_id) count++;
    if (filters.interests && filters.interests.length > 0) count++;
    if (filters.goals && filters.goals.length > 0) count++;
    if (filters.years_experience) count++;
    if (filters.min_age || filters.max_age) count++;
    if (filters.sex) count++;
    
    setActiveFilters(count);
  }, [filters]);

  // Search tutors
  const searchTutors = async () => {
    setIsLoading(true);
    setError(null);
    setFiltersApplied(true);
    
    try {
      // Log filters for debugging
      console.log('Submitting search with filters:', JSON.stringify(filters, null, 2));
      
      const tutorsData = await tutorService.searchTutors(filters);
      console.log('Received tutors:', tutorsData.length);
      setTutors(tutorsData);
      
      // Close filters on mobile after search
      if (isMobile) {
        setFiltersVisible(false);
      }
      
      // Scroll to results on mobile
      if (isMobile && tutorsData.length > 0) {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Search error:', error);
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Initial search on page load
  useEffect(() => {
    searchTutors();
  }, []);

  // Handle filter changes
  const handleFilterChange = (field: keyof TutorSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // New handlers for checkbox-based multi-selects
  const toggleLanguageSelection = (languageName: string) => {
    setFilters(prev => {
      const currentLanguages = prev.languages || [];
      if (currentLanguages.includes(languageName)) {
        return {
          ...prev,
          languages: currentLanguages.filter(lang => lang !== languageName)
        };
      } else {
        return {
          ...prev,
          languages: [...currentLanguages, languageName]
        };
      }
    });
  };

  const toggleInterestSelection = (interestId: number) => {
    setFilters(prev => {
      const currentInterests = prev.interests || [];
      if (currentInterests.includes(interestId)) {
        return {
          ...prev,
          interests: currentInterests.filter(id => id !== interestId)
        };
      } else {
        return {
          ...prev,
          interests: [...currentInterests, interestId]
        };
      }
    });
  };

  const toggleGoalSelection = (goalId: number) => {
    setFilters(prev => {
      const currentGoals = prev.goals || [];
      if (currentGoals.includes(goalId)) {
        return {
          ...prev,
          goals: currentGoals.filter(id => id !== goalId)
        };
      } else {
        return {
          ...prev,
          goals: [...currentGoals, goalId]
        };
      }
    });
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({});
    searchTutors();
  };

  // Toggle filters visibility (for mobile)
  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  // Handle sort change
  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value);
    // Future implementation: Actually sort tutors based on selection
  };

  // Filter badge component
  const FilterBadge = ({ label, onClear }: { label: string, onClear: () => void }) => (
    <div className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-1 rounded flex items-center space-x-1 whitespace-nowrap">
      <span>{label}</span>
      <button onClick={onClear} className="ml-1 text-orange-500 hover:text-orange-700">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  // Active filters display
  const renderActiveFiltersList = () => {
    if (activeFilters === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {filters.languages && filters.languages.length > 0 && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_languages', { languages: filters.languages.join(', ') })} 
            onClear={() => handleFilterChange('languages', [])} 
          />
        )}
        
        {filters.proficiency_id && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_proficiency', { proficiency: proficiencies.find(p => p.id === filters.proficiency_id)?.name || filters.proficiency_id })} 
            onClear={() => handleFilterChange('proficiency_id', undefined)} 
          />
        )}
        
        {filters.interests && filters.interests.length > 0 && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_interests', { count: filters.interests.length })} 
            onClear={() => handleFilterChange('interests', [])} 
          />
        )}
        
        {filters.goals && filters.goals.length > 0 && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_goals', { count: filters.goals.length })} 
            onClear={() => handleFilterChange('goals', [])} 
          />
        )}
        
        {filters.years_experience && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_experience', { years: filters.years_experience })} 
            onClear={() => handleFilterChange('years_experience', undefined)} 
          />
        )}
        
        {(filters.min_age || filters.max_age) && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_age', { min: filters.min_age || t('pages.search_tutor.any'), max: filters.max_age || t('pages.search_tutor.any') })} 
            onClear={() => {
              handleFilterChange('min_age', undefined);
              handleFilterChange('max_age', undefined);
            }} 
          />
        )}
        
        {filters.sex && (
          <FilterBadge 
            label={t('pages.search_tutor.filter_gender', { gender: filters.sex })} 
            onClear={() => handleFilterChange('sex', '')} 
          />
        )}
        
        {activeFilters > 0 && (
          <button 
            onClick={handleResetFilters} 
            className="text-xs text-gray-600 hover:text-gray-800 underline flex items-center ml-2"
          >
            {t('pages.search_tutor.clear_all')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t('pages.search_tutor.title')}</h1>
          </div>
          
          {isMobile && (
            <button 
              onClick={toggleFilters}
              className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-2 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {filtersVisible ? 'Hide Filters' : (
                <span className="flex items-center">
                  Filters
                  {activeFilters > 0 && (
                    <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </span>
              )}
            </button>
          )}
        </div>
        
        {/* Show active filters below header */}
        {filtersApplied && !isMobile && renderActiveFiltersList()}
      </header>
      
      <div className={`flex flex-col md:flex-row gap-6 ${isMobile ? 'relative' : ''}`}>
        {/* Filters Section - Sidebar on desktop, collapsible panel on mobile */}
        <aside className={`
          ${isMobile ? 
            `${filtersVisible ? 'max-h-[2000px] opacity-100 mb-6' : 'max-h-0 opacity-0 overflow-hidden'} transition-all duration-300` 
            : 'md:w-1/4 md:sticky md:top-4 md:self-start'
          }
        `}>
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  {t('pages.search_tutor.filters')}
                </h2>
                <button 
                  onClick={handleResetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('pages.search_tutor.reset_filters')}
                </button>
              </div>
              
              {filtersApplied && isMobile && renderActiveFiltersList()}
            </div>
            
            <div className="p-5 space-y-6">
              {/* Language Filter Group */}
              <div className="filter-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.search_tutor.language')}
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {languages.length === 0 ? (
                    <div className="text-gray-500 text-sm py-1">{t('pages.search_tutor.loading_languages')}</div>
                  ) : (
                    languages.map(language => (
                      <div key={language.id} className="flex items-center mb-1 last:mb-0">
                        <input
                          id={`language-${language.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                          checked={(filters.languages || []).includes(language.name)}
                          onChange={() => toggleLanguageSelection(language.name)}
                        />
                        <label htmlFor={`language-${language.id}`} className="ml-2 block text-sm text-gray-700">
                          {language.name}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Proficiency Filter */}
              <div className="filter-group">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('pages.search_tutor.min_proficiency')}
                </label>
                <select 
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                  value={filters.proficiency_id || ''}
                  onChange={(e) => handleFilterChange('proficiency_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">{t('common.all')}</option>
                  {proficiencies.map(proficiency => (
                    <option key={proficiency.id} value={proficiency.id}>
                      {proficiency.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Collapsible Advanced Filters */}
              <details className="group [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-gray-700 text-sm border-t border-b border-gray-100 py-3 -mx-5 px-5">
                  <span>{t('pages.search_tutor.advanced_filters')}</span>
                  <svg className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                
                <div className="mt-3 space-y-4">
                  {/* Years Experience Filter */}
                  <div className="filter-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('pages.search_tutor.min_experience')}
                    </label>
                    <div className="relative">
                      <input 
                        type="range"
                        min="0"
                        max="20"
                        step="1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        value={filters.years_experience || 0}
                        onChange={(e) => handleFilterChange('years_experience', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <div className="flex justify-between text-xs text-gray-600 px-1 mt-1">
                        <span>{t('pages.search_tutor.any')}</span>
                        <span>{t('pages.search_tutor.ten_plus_years')}</span>
                        <span>{t('pages.search_tutor.twenty_plus_years')}</span>
                      </div>
                      <div className="text-center font-medium text-sm text-orange-600 mt-2">
                        {filters.years_experience ? t('pages.search_tutor.years_experience_value', { count: filters.years_experience }) : t('pages.search_tutor.any_experience')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Interests Filter */}
                  <div className="filter-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('pages.search_tutor.interests')}
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {interests.length === 0 ? (
                        <div className="text-gray-500 text-sm py-1">{t('pages.search_tutor.loading_interests')}</div>
                      ) : (
                        interests.map(interest => (
                          <div key={interest.id} className="flex items-center mb-1 last:mb-0">
                            <input
                              id={`interest-${interest.id}`}
                              type="checkbox"
                              className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                              checked={(filters.interests || []).includes(interest.id)}
                              onChange={() => toggleInterestSelection(interest.id)}
                            />
                            <label htmlFor={`interest-${interest.id}`} className="ml-2 block text-sm text-gray-700">
                              {interest.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Goals Filter */}
                  <div className="filter-group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('pages.search_tutor.goals')}
                    </label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {goals.length === 0 ? (
                        <div className="text-gray-500 text-sm py-1">{t('pages.search_tutor.loading_goals')}</div>
                      ) : (
                        goals.map(goal => (
                          <div key={goal.id} className="flex items-center mb-1 last:mb-0">
                            <input
                              id={`goal-${goal.id}`}
                              type="checkbox"
                              className="h-4 w-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                              checked={(filters.goals || []).includes(goal.id)}
                              onChange={() => toggleGoalSelection(goal.id)}
                            />
                            <label htmlFor={`goal-${goal.id}`} className="ml-2 block text-sm text-gray-700">
                              {goal.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* Age Range Filters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="filter-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pages.search_tutor.age_range')}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number"
                          min="16"
                          placeholder={t('pages.search_tutor.min')}
                          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                          value={filters.min_age || ''}
                          onChange={(e) => handleFilterChange('min_age', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                        <input 
                          type="number"
                          min="16"
                          placeholder={t('pages.search_tutor.max')}
                          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                          value={filters.max_age || ''}
                          onChange={(e) => handleFilterChange('max_age', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                    <div></div>
                    {/* Gender Filter */}
                    <div className="filter-group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('pages.search_tutor.gender')}
                      </label>
                      <select 
                        className="w-full rounded-lg border border-gray-300 py-2 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                        value={filters.sex || ''}
                        onChange={(e) => handleFilterChange('sex', e.target.value)}
                      >
                        <option value="">{t('common.all')}</option>
                        <option value="male">{t('common.male')}</option>
                        <option value="female">{t('common.female')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </details>
              
              {/* Apply Filters Button */}
              <button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                onClick={searchTutors}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('pages.search_tutor.find_tutors')}
              </button>
            </div>
          </div>
        </aside>
        
        {/* Results Section */}
        <main className={`${isMobile ? 'w-full' : 'md:w-3/4'}`} id="results-section">
          {/* Results Header with Sort Options */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">
                {t('pages.search_tutor.results')}
              </h2>
              {tutors.length > 0 && (
                <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  {t('pages.search_tutor.tutors_found', { count: tutors.length })}
                </span>
              )}
            </div>
            
            {tutors.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">{t('pages.search_tutor.sort_by')}:</label>
                <select 
                  value={sortBy}
                  onChange={handleSortChange}
                  className="text-sm rounded-md border-gray-300 py-1 pl-2 pr-7 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="experience">{t('pages.search_tutor.experience')}</option>
                  <option value="rating">{t('pages.search_tutor.rating')}</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-lg text-gray-600">{t('common.loading')}</p>
              <p className="text-sm text-gray-500 mt-2">{t('pages.search_tutor.finding_tutors')}</p>
            </div>
          ) : tutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {tutors.map(tutor => (
                <TutorCard key={tutor.user_id} tutor={tutor} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-10 text-center">
              <div className="bg-orange-50 p-4 inline-flex rounded-full items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('pages.search_tutor.no_results')}</h3>
              
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {t('pages.search_tutor.no_results_message')}
              </p>
              
              <div className="flex flex-wrap justify-center gap-3">
                <button 
                  onClick={handleResetFilters}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-5 rounded-lg transition-colors"
                >
                  {t('pages.search_tutor.clear_all_filters')}
                </button>
                
                {isMobile && (
                  <button 
                    onClick={() => setFiltersVisible(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-5 rounded-lg transition-colors"
                  >
                    {t('pages.search_tutor.adjust_filters')}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}; 