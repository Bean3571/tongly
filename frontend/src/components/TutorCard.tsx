import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TutorProfile } from '../types/tutor';
import { UserLanguage } from '../types/language';

interface TutorCardProps {
  tutor: TutorProfile;
}

export const TutorCard: React.FC<TutorCardProps> = ({ tutor }) => {
  const navigate = useNavigate();
  
  // Handle scheduling lesson
  const handleScheduleLesson = () => {
    navigate(`/schedule-lesson/${tutor.user_id}`);
  };

  // Format the education array into a readable string
  const formatEducation = () => {
    if (!tutor.education || !Array.isArray(tutor.education) || tutor.education.length === 0) {
      return 'Not specified';
    }
    
    return tutor.education.map((edu: any) => 
      `${edu.degree} in ${edu.field_of_study} at ${edu.institution}`
    ).join(', ');
  };

  // Format languages
  const formatLanguages = (languages: UserLanguage[] | undefined) => {
    if (!languages || languages.length === 0) {
      return 'Not specified';
    }
    
    return languages.map(lang => 
      `${lang.language?.name || ''} (${lang.proficiency?.name || ''})`
    ).join(', ');
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg group">
      <div className="p-6">
        <div className="flex items-center space-x-4">
          {/* Avatar with border gradient effect */}
          <div className="flex-shrink-0">
            <div className="relative w-20 h-20 p-1 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full">
              <img 
                src={tutor.user?.profile_picture_url || '/default-avatar.png'} 
                alt={`${tutor.user?.first_name} ${tutor.user?.last_name}`}
                className="w-full h-full rounded-full object-cover border-2 border-white"
              />
            </div>
          </div>
          
          {/* Tutor basic info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate mb-1">
              {tutor.user?.first_name} {tutor.user?.last_name}
            </h2>
            <div className="flex flex-wrap items-center text-sm">
              <div className="flex items-center mr-3">
                <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1 font-medium text-gray-600">
                  4.5 (TODO: Real ratings)
                </span>
              </div>
              <span className="text-gray-400 mx-1">•</span>
              <span className="text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {tutor.years_experience} {tutor.years_experience === 1 ? 'year' : 'years'} experience
                </span>
              </span>
            </div>
          </div>
        </div>
        
        {/* Additional tutor details */}
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex">
            <span className="w-24 flex-shrink-0 text-gray-500 font-medium">Languages:</span>
            <span className="text-gray-700 flex-1">{formatLanguages(tutor.languages)}</span>
          </div>
          
          <div className="flex">
            <span className="w-24 flex-shrink-0 text-gray-500 font-medium">Education:</span>
            <span className="text-gray-700 flex-1 line-clamp-2 overflow-hidden">{formatEducation()}</span>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {tutor.user?.age && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">{tutor.user.age} years old</span>
              </div>
            )}
            
            {tutor.user?.sex && tutor.user.sex !== 'not_set' && (
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {tutor.user.sex === 'male' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  )}
                </svg>
                <span className="text-gray-700">
                  {tutor.user.sex.charAt(0).toUpperCase() + tutor.user.sex.slice(1)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Bio preview */}
        {tutor.bio && (
          <div className="mt-4 text-sm text-gray-600 line-clamp-2 overflow-hidden">
            {tutor.bio}
          </div>
        )}
        
        {/* Schedule lesson button with hover effect */}
        <div className="mt-5">
          <button
            onClick={handleScheduleLesson}
            className="w-full bg-white hover:bg-orange-500 text-orange-500 hover:text-white font-medium py-2.5 px-4 rounded-lg transition-all border-2 border-orange-500 shadow-sm group-hover:shadow-md"
          >
            Schedule Lesson
          </button>
        </div>
      </div>
    </div>
  );
}; 