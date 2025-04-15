import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/I18nContext';
import { getErrorMessage, languageService, interestService, goalService } from '../services/api';
import { Language, LanguageProficiency, UserLanguage, UserLanguageUpdate } from '../types/language';
import { Interest, UserInterest, Goal, UserGoal } from '../types/interest-goal';
import { toast } from 'react-hot-toast';

export const UserPreferences = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('languages');
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Languages state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [proficiencies, setProficiencies] = useState<LanguageProficiency[]>([]);
  const [userLanguages, setUserLanguages] = useState<UserLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<number>(0);
  const [selectedProficiency, setSelectedProficiency] = useState<number>(0);

  // Interests state
  const [interests, setInterests] = useState<Interest[]>([]);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<number>(0);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<number>(0);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === 'languages' || activeTab === 'all') {
          await loadLanguagesData();
        }
        if (activeTab === 'interests' || activeTab === 'all') {
          await loadInterestsData();
        }
        if (activeTab === 'goals' || activeTab === 'all') {
          await loadGoalsData();
        }
      } catch (error: any) {
        setError(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  const loadLanguagesData = async () => {
    const [allLanguages, allProficiencies, myLanguages] = await Promise.all([
      languageService.getAllLanguages(),
      languageService.getAllProficiencies(),
      languageService.getUserLanguages()
    ]);

    setLanguages(allLanguages);
    setProficiencies(allProficiencies);
    setUserLanguages(myLanguages);

    // Set initial selection if there are options available
    if (allLanguages.length > 0 && allProficiencies.length > 0) {
      setSelectedLanguage(allLanguages[0].id);
      setSelectedProficiency(allProficiencies[0].id);
    }
  };

  const loadInterestsData = async () => {
    const [allInterests, myInterests] = await Promise.all([
      interestService.getAllInterests(),
      interestService.getUserInterests()
    ]);

    setInterests(allInterests);
    setUserInterests(myInterests);

    // Filter out interests the user already has
    const availableInterests = allInterests.filter(
      interest => !myInterests.some(userInterest => userInterest.interest_id === interest.id)
    );
    
    if (availableInterests.length > 0) {
      setSelectedInterest(availableInterests[0].id);
    }
  };

  const loadGoalsData = async () => {
    const [allGoals, myGoals] = await Promise.all([
      goalService.getAllGoals(),
      goalService.getUserGoals()
    ]);

    setGoals(allGoals);
    setUserGoals(myGoals);

    // Filter out goals the user already has
    const availableGoals = allGoals.filter(
      goal => !myGoals.some(userGoal => userGoal.goal_id === goal.id)
    );
    
    if (availableGoals.length > 0) {
      setSelectedGoal(availableGoals[0].id);
    }
  };

  // Languages handlers
  const handleAddLanguage = async () => {
    if (!selectedLanguage || !selectedProficiency) return;
    
    // Check if the language is already added by the user
    const languageExists = userLanguages.some(ul => ul.language_id === selectedLanguage);
    if (languageExists) {
      toast.error(t('pages.user_preferences.language_already_exists'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      const languageData: UserLanguageUpdate = {
        language_id: selectedLanguage,
        proficiency_id: selectedProficiency
      };
      
      const newUserLanguage = await languageService.addUserLanguage(languageData);
      setUserLanguages([...userLanguages, newUserLanguage]);
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLanguage = async (userLanguageId: number, newProficiencyId: number) => {
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      const languageData: UserLanguageUpdate = {
        language_id: userLanguageId,
        proficiency_id: newProficiencyId
      };
      
      const updatedUserLanguage = await languageService.updateUserLanguage(userLanguageId, languageData);
      
      setUserLanguages(userLanguages.map(ul => 
        ul.language_id === updatedUserLanguage.language_id ? updatedUserLanguage : ul
      ));
      
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLanguage = async (languageId: number) => {
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      await languageService.deleteUserLanguage(languageId);
      setUserLanguages(userLanguages.filter(ul => ul.language_id !== languageId));
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Interests handlers
  const handleAddInterest = async () => {
    if (!selectedInterest) return;
    
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      const newUserInterest = await interestService.addUserInterest(selectedInterest);
      setUserInterests([...userInterests, newUserInterest]);
      
      // Update selected interest
      const availableInterests = interests.filter(
        interest => !userInterests.some(ui => ui.interest_id === interest.id) && interest.id !== selectedInterest
      );
      
      if (availableInterests.length > 0) {
        setSelectedInterest(availableInterests[0].id);
      } else {
        setSelectedInterest(0);
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInterest = async (interestId: number) => {
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      await interestService.deleteUserInterest(interestId);
      setUserInterests(userInterests.filter(ui => ui.interest_id !== interestId));
      
      // Update selected interest if none is selected
      if (selectedInterest === 0) {
        const availableInterests = interests.filter(
          interest => !userInterests.some(ui => ui.interest_id === interest.id)
        );
        
        if (availableInterests.length > 0) {
          setSelectedInterest(availableInterests[0].id);
        }
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Goals handlers
  const handleAddGoal = async () => {
    if (!selectedGoal) return;
    
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      const newUserGoal = await goalService.addUserGoal(selectedGoal);
      setUserGoals([...userGoals, newUserGoal]);
      
      // Update selected goal
      const availableGoals = goals.filter(
        goal => !userGoals.some(ug => ug.goal_id === goal.id) && goal.id !== selectedGoal
      );
      
      if (availableGoals.length > 0) {
        setSelectedGoal(availableGoals[0].id);
      } else {
        setSelectedGoal(0);
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    setIsLoading(true);
    setError(null);
    setUpdateSuccess(false);
    
    try {
      await goalService.deleteUserGoal(goalId);
      setUserGoals(userGoals.filter(ug => ug.goal_id !== goalId));
      
      // Update selected goal if none is selected
      if (selectedGoal === 0) {
        const availableGoals = goals.filter(
          goal => !userGoals.some(ug => ug.goal_id === goal.id)
        );
        
        if (availableGoals.length > 0) {
          setSelectedGoal(availableGoals[0].id);
        }
      }
      
      setUpdateSuccess(true);
    } catch (error: any) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Get a language name by id
  const getLanguageName = (id: number) => {
    const language = languages.find(lang => lang.id === id);
    return language?.name || '';
  };

  // Get a proficiency name by id
  const getProficiencyName = (id: number) => {
    const proficiency = proficiencies.find(prof => prof.id === id);
    return proficiency?.name || '';
  };

  // Get an interest name by id
  const getInterestName = (id: number) => {
    const interest = interests.find(int => int.id === id);
    return interest?.name || '';
  };

  // Get a goal name by id
  const getGoalName = (id: number) => {
    const goal = goals.find(g => g.id === id);
    return goal?.name || '';
  };

  // Get available languages (not yet added by user)
  const getAvailableLanguages = () => {
    return languages.filter(
      language => !userLanguages.some(ul => ul.language_id === language.id)
    );
  };

  // Get available interests (not yet added by user)
  const getAvailableInterests = () => {
    return interests.filter(
      interest => !userInterests.some(ui => ui.interest_id === interest.id)
    );
  };

  // Get available goals (not yet added by user)
  const getAvailableGoals = () => {
    return goals.filter(
      goal => !userGoals.some(ug => ug.goal_id === goal.id)
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{t('pages.user_preferences.title')}</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('languages')}
            className={`${
              activeTab === 'languages'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-6 font-medium text-sm border-b-2 focus:outline-none`}
          >
            {t('pages.user_preferences.languages_tab')}
          </button>
          <button
            onClick={() => setActiveTab('interests')}
            className={`${
              activeTab === 'interests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-6 font-medium text-sm border-b-2 focus:outline-none`}
          >
            {t('pages.user_preferences.interests_tab')}
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`${
              activeTab === 'goals'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } py-4 px-6 font-medium text-sm border-b-2 focus:outline-none`}
          >
            {t('pages.user_preferences.goals_tab')}
          </button>
        </nav>
      </div>
      
      {/* Success message */}
      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-600">
          {t('common.update_success')}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="spinner">{t('common.loading')}</div>
        </div>
      )}
      
      {/* Languages Tab */}
      {activeTab === 'languages' && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">{t('pages.user_preferences.languages_title')}</h2>
          
          {/* User's current languages */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.my_languages')}</h3>
            
            {userLanguages.length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_languages')}</p>
            ) : (
              <div className="space-y-4">
                {userLanguages.map(userLanguage => (
                  <div key={userLanguage.language_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <span className="font-medium">{getLanguageName(userLanguage.language_id)}</span>
                      <span className="text-gray-500 ml-2">({getProficiencyName(userLanguage.proficiency_id)})</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={userLanguage.proficiency_id}
                        onChange={(e) => handleUpdateLanguage(userLanguage.language_id, Number(e.target.value))}
                        className="block rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      >
                        {proficiencies.map(proficiency => (
                          <option key={proficiency.id} value={proficiency.id}>
                            {proficiency.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDeleteLanguage(userLanguage.language_id)}
                        className="inline-flex items-center p-1 border border-transparent rounded-full text-red-500 hover:bg-red-50 focus:outline-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add new language */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.add_language')}</h3>
            
            {getAvailableLanguages().length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_more_languages')}</p>
            ) : (
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.user_preferences.language')}
                  </label>
                  <select
                    id="language"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  >
                    {getAvailableLanguages().map(language => (
                      <option key={language.id} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex-1">
                  <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.user_preferences.proficiency')}
                  </label>
                  <select
                    id="proficiency"
                    value={selectedProficiency}
                    onChange={(e) => setSelectedProficiency(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  >
                    {proficiencies.map(proficiency => (
                      <option key={proficiency.id} value={proficiency.id}>
                        {proficiency.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddLanguage}
                  disabled={!selectedLanguage || !selectedProficiency}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Interests Tab */}
      {activeTab === 'interests' && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">{t('pages.user_preferences.interests_title')}</h2>
          
          {/* User's current interests */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.my_interests')}</h3>
            
            {userInterests.length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_interests')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userInterests.map(userInterest => (
                  <div key={userInterest.interest_id} className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-gray-800">{getInterestName(userInterest.interest_id)}</span>
                    <button
                      onClick={() => handleDeleteInterest(userInterest.interest_id)}
                      className="ml-2 text-gray-500 hover:text-red-500 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add new interest */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.add_interest')}</h3>
            
            {getAvailableInterests().length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_more_interests')}</p>
            ) : (
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.user_preferences.interest')}
                  </label>
                  <select
                    id="interest"
                    value={selectedInterest}
                    onChange={(e) => setSelectedInterest(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  >
                    {getAvailableInterests().map(interest => (
                      <option key={interest.id} value={interest.id}>
                        {interest.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddInterest}
                  disabled={!selectedInterest}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Goals Tab */}
      {activeTab === 'goals' && !isLoading && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">{t('pages.user_preferences.goals_title')}</h2>
          
          {/* User's current goals */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.my_goals')}</h3>
            
            {userGoals.length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_goals')}</p>
            ) : (
              <div className="space-y-2">
                {userGoals.map(userGoal => (
                  <div key={userGoal.goal_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{getGoalName(userGoal.goal_id)}</span>
                    <button
                      onClick={() => handleDeleteGoal(userGoal.goal_id)}
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Add new goal */}
          <div>
            <h3 className="text-lg font-medium mb-4">{t('pages.user_preferences.add_goal')}</h3>
            
            {getAvailableGoals().length === 0 ? (
              <p className="text-gray-500">{t('pages.user_preferences.no_more_goals')}</p>
            ) : (
              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.user_preferences.goal')}
                  </label>
                  <select
                    id="goal"
                    value={selectedGoal}
                    onChange={(e) => setSelectedGoal(Number(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                  >
                    {getAvailableGoals().map(goal => (
                      <option key={goal.id} value={goal.id}>
                        {goal.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={handleAddGoal}
                  disabled={!selectedGoal}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {t('common.add')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPreferences; 