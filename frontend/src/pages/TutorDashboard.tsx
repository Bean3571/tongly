import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../api/client';
import { Language, Degree, TutorProfileUpdateRequest } from '../types/tutor';

interface TutorProfile extends TutorProfileUpdateRequest {}

const LANGUAGE_LEVELS = [
  'Beginner (A1)',
  'Elementary (A2)',
  'Intermediate (B1)',
  'Upper Intermediate (B2)',
  'Advanced (C1)',
  'Mastery (C2)',
  'Native'
];

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean'
];

export default function TutorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState<TutorProfile>({
    nativeLanguages: [],
    teachingLanguages: [],
    bio: '',
    interests: [],
    hourlyRate: 25,
    offersTrial: true,
    degrees: [],
    introductionVideo: ''
  });

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [newLanguage, setNewLanguage] = useState<Language>({ language: '', level: '' });
  const [stats, setStats] = useState({
    totalLessons: 0,
    totalEarnings: 0,
    averageRating: 0,
    upcomingLessons: 0
  });

  const [newDegree, setNewDegree] = useState<Degree>({
    degree: '',
    institution: '',
    startYear: '',
    endYear: '',
    fieldOfStudy: '',
  });

  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    loadTutorProfile();
    loadTutorStats();
  }, []);

  const loadTutorProfile = async () => {
    try {
      const response = await api.tutors.getProfile();
      setProfile(response);
    } catch (error) {
      showNotification('error', 'Failed to load tutor profile');
    }
  };

  const loadTutorStats = async () => {
    // TODO: Implement API endpoint for stats
    setStats({
      totalLessons: 24,
      totalEarnings: 600,
      averageRating: 4.8,
      upcomingLessons: 3
    });
  };

  const handleSave = async () => {
    try {
      if (videoFile) {
        const formData = new FormData();
        formData.append('video', videoFile);
        const response = await api.tutors.uploadVideo(formData);
        profile.introductionVideo = response.videoUrl;
      }

      await api.tutors.updateProfile(profile);
      showNotification('success', 'Profile updated successfully');
    } catch (error) {
      showNotification('error', 'Failed to update profile');
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'Video file must be smaller than 5MB');
      return;
    }

    // Check video duration
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 300) { // 300 seconds = 5 minutes
        showNotification('error', 'Video must be shorter than 5 minutes');
        return;
      }
      setVideoFile(file);
    };

    video.src = URL.createObjectURL(file);
  };

  const handleAddDegree = () => {
    if (!newDegree.degree || !newDegree.institution || !newDegree.startYear || !newDegree.endYear || !newDegree.fieldOfStudy) {
      showNotification('error', 'Please fill in all degree fields');
      return;
    }
    setProfile(prev => ({
      ...prev,
      degrees: [...prev.degrees, newDegree]
    }));
    setNewDegree({
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      fieldOfStudy: '',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user?.profile?.first_name || user?.username}!</h1>
        <button
          onClick={() => navigate('/schedule')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Manage Schedule
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Lessons</h3>
          <p className="text-2xl font-bold mt-2">{stats.totalLessons}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Earnings</h3>
          <p className="text-2xl font-bold mt-2">${stats.totalEarnings}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Average Rating</h3>
          <p className="text-2xl font-bold mt-2">{stats.averageRating} ⭐</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Upcoming Lessons</h3>
          <p className="text-2xl font-bold mt-2">{stats.upcomingLessons}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => navigate('/lessons')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">View Upcoming Lessons</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Check your schedule and prepare for lessons</p>
        </button>
        <button
          onClick={() => navigate('/wallet')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">View Earnings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your income and payment history</p>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <h3 className="font-semibold mb-2">Edit Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Update your information and availability</p>
        </button>
      </div>

      {/* Profile Sections */}
      <div className="space-y-8">
        {/* Bio Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">About Me</h2>
          <div className="space-y-4">
            <textarea
              className="w-full h-48 p-4 border rounded-lg resize-y bg-gray-50 dark:bg-gray-700"
              placeholder="Tell students about yourself, your background, teaching experience, and what makes your lessons unique..."
              value={profile.bio}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            />
            <p className="text-sm text-gray-500">
              Pro tip: Include information about your teaching experience, methodology, and what students can expect from your lessons.
            </p>
          </div>
        </section>

        {/* Native Languages Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Native Languages</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <select
                className="form-select w-full p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value=""
                onChange={(e) => {
                  if (profile.nativeLanguages.length >= 3) {
                    showNotification('error', 'Maximum 3 native languages allowed');
                    return;
                  }
                  if (e.target.value) {
                    setProfile(prev => ({
                      ...prev,
                      nativeLanguages: [...prev.nativeLanguages, e.target.value]
                    }));
                  }
                }}
              >
                <option value="">Select a language</option>
                {LANGUAGES.filter(lang => !profile.nativeLanguages.includes(lang)).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.nativeLanguages.map((lang, index) => (
                <div key={index} className="flex items-center bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span>{lang}</span>
                  <button
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      nativeLanguages: prev.nativeLanguages.filter((_, i) => i !== index)
                    }))}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500">Maximum 3 native languages allowed</p>
          </div>
        </section>

        {/* Teaching Languages Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Languages I Teach</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className="form-select p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newLanguage.language}
                onChange={(e) => setNewLanguage(prev => ({ ...prev, language: e.target.value }))}
              >
                <option value="">Select a language</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <select
                className="form-select p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newLanguage.level}
                onChange={(e) => setNewLanguage(prev => ({ ...prev, level: e.target.value }))}
              >
                <option value="">Select proficiency level</option>
                {LANGUAGE_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                if (!newLanguage.language || !newLanguage.level) {
                  showNotification('error', 'Please select both language and level');
                  return;
                }
                setProfile(prev => ({
                  ...prev,
                  teachingLanguages: [...prev.teachingLanguages, newLanguage]
                }));
                setNewLanguage({ language: '', level: '' });
              }}
              className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Teaching Language
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {profile.teachingLanguages.map((lang, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <span className="font-medium">{lang.language}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">- {lang.level}</span>
                  </div>
                  <button
                    onClick={() => {
                      const newLanguages = [...profile.teachingLanguages];
                      newLanguages.splice(index, 1);
                      setProfile(prev => ({ ...prev, teachingLanguages: newLanguages }));
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Education Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Education</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Degree (e.g., Bachelor's in English)"
                className="form-input p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newDegree.degree}
                onChange={(e) => setNewDegree(prev => ({ ...prev, degree: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Institution"
                className="form-input p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newDegree.institution}
                onChange={(e) => setNewDegree(prev => ({ ...prev, institution: e.target.value }))}
              />
              <input
                type="text"
                placeholder="Field of Study"
                className="form-input p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newDegree.fieldOfStudy}
                onChange={(e) => setNewDegree(prev => ({ ...prev, fieldOfStudy: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Start Year"
                  className="form-input p-2 border rounded bg-gray-50 dark:bg-gray-700"
                  value={newDegree.startYear}
                  onChange={(e) => setNewDegree(prev => ({ ...prev, startYear: e.target.value }))}
                />
                <input
                  type="number"
                  placeholder="End Year"
                  className="form-input p-2 border rounded bg-gray-50 dark:bg-gray-700"
                  value={newDegree.endYear}
                  onChange={(e) => setNewDegree(prev => ({ ...prev, endYear: e.target.value }))}
                />
              </div>
            </div>
            <button
              onClick={handleAddDegree}
              className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Degree
            </button>
            <div className="space-y-4 mt-4">
              {profile.degrees.map((degree, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold">{degree.degree}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{degree.institution}</p>
                      <p className="text-gray-500 dark:text-gray-400">{degree.fieldOfStudy}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{degree.startYear} - {degree.endYear}</p>
                    </div>
                    <button
                      onClick={() => setProfile(prev => ({
                        ...prev,
                        degrees: prev.degrees.filter((_, i) => i !== index)
                      }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interests Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Interests & Hobbies</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Add an interest or hobby"
                className="form-input flex-grow p-2 border rounded bg-gray-50 dark:bg-gray-700"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && newInterest && setProfile(prev => {
                  setNewInterest('');
                  return { ...prev, interests: [...prev.interests, newInterest] };
                })}
              />
              <button
                onClick={() => {
                  if (!newInterest) return;
                  setProfile(prev => ({
                    ...prev,
                    interests: [...prev.interests, newInterest]
                  }));
                  setNewInterest('');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                  {interest}
                  <button
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      interests: prev.interests.filter((_, i) => i !== index)
                    }))}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Pricing & Availability</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hourly Rate (USD)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={profile.hourlyRate}
                  onChange={(e) => setProfile(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                  className="w-32 p-2 border rounded bg-gray-50 dark:bg-gray-700"
                />
                <span>USD per hour</span>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profile.offersTrial}
                  onChange={(e) => setProfile(prev => ({ ...prev, offersTrial: e.target.checked }))}
                  className="form-checkbox"
                />
                <span>Offer trial lessons (30 minutes)</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Trial lessons help students decide if you're the right tutor for them
              </p>
            </div>
            <div>
              <button
                onClick={() => navigate('/schedule')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Manage Teaching Schedule
              </button>
              <p className="text-sm text-gray-500 mt-1">
                Set your weekly availability and manage lesson times
              </p>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 