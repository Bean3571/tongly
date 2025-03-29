import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { 
    Typography, 
    Input, 
    Select, 
    Button, 
    Tag, 
    notification, 
    Upload, 
    Spin,
    Alert
} from 'antd';
import { 
    UploadOutlined, 
    DeleteOutlined, 
    SaveOutlined,
    PlusOutlined
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useTranslation } from '../contexts/I18nContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface TeachingLanguage {
    language: string;
    level: string;
}

interface Education {
    degree: string;
    institution: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
}

interface TutorProfile {
    bio: string;
    teachingLanguages: TeachingLanguage[];
    education: Education[];
    interests: string[];
    introductionVideo?: string;
}

const LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian',
    'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hindi'
];

const LANGUAGE_LEVELS = [
    'Native', 'Fluent (C2)', 'Advanced (C1)'
];


const INTERESTS = [
    'Reading', 'Writing', 'Music', 'Movies', 'Travel', 'Sports', 'Cooking',
    'Photography', 'Art', 'Technology', 'Science', 'History', 'Culture'
];

const EDUCATION_DEGREES = [
    'High School',
    'Associate',
    'Bachelor',
    'Master',
    'PhD',
    'Other'
];

export const TeachingProfile: React.FC = () => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<TutorProfile>({
        bio: '',
        teachingLanguages: [],
        education: [],
        interests: [],
        introductionVideo: undefined
    });

    const [newLanguage, setNewLanguage] = useState<TeachingLanguage>({
        language: '',
        level: ''
    });

    const [newEducation, setNewEducation] = useState<Education>({
        degree: '',
        institution: '',
        field_of_study: '',
        start_year: '',
        end_year: ''
    });

    const [videoFile, setVideoFile] = useState<UploadFile | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout>();
    const { t } = useTranslation();

    useEffect(() => {
        loadProfile();
        
        // Scroll to section if specified
        if (location.state?.section) {
            const element = document.getElementById(location.state.section);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    const loadProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/tutors/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProfile({
                    ...data,
                    teachingLanguages: data.teachingLanguages || [],
                    education: data.education || [],
                    interests: data.interests || []
                });
            }
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Failed to load profile data',
            });
            setProfile({
                bio: '',
                teachingLanguages: [],
                education: [],
                interests: [],
                introductionVideo: undefined
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSave = async (updatedProfile: Partial<TutorProfile>) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                setSaving(true);
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:8080/api/tutors/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedProfile),
                });

                if (!response.ok) {
                    throw new Error('Failed to save changes');
                }

                notification.success({
                    message: 'Changes saved',
                    description: 'Your profile has been updated successfully',
                });
            } catch (error) {
                notification.error({
                    message: 'Error',
                    description: 'Failed to save changes',
                });
            } finally {
                setSaving(false);
            }
        }, 1000);
    };

    const handleVideoUpload = async (file: File) => {
        try {
            const formData = new FormData();
            formData.append('video', file);

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/tutors/video', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload video');
            }

            const data = await response.json();
            const newProfile = { ...profile, introductionVideo: data.url };
            setProfile(newProfile);
            handleAutoSave(newProfile);
            notification.success({
                message: 'Video uploaded',
                description: 'Your introduction video has been uploaded successfully',
            });
        } catch (error) {
            notification.error({
                message: 'Error',
                description: 'Failed to upload video',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center">
                <Title level={2} className="text-gray-800 dark:text-gray-100">
                    {t('tutors.profile.title')}
                </Title>
                {saving && (
                    <Text className="text-gray-500">
                        <Spin size="small" className="mr-2" />
                        {t('common.saving')}
                    </Text>
                )}
            </div>

            {/* Bio Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <Title level={3} className="text-gray-800 dark:text-gray-100 mb-4">
                    {t('tutors.profile.about')}
                </Title>
                <div className="space-y-4">
                    <TextArea
                        rows={6}
                        placeholder={t('tutors.profile.about.placeholder')}
                        value={profile.bio}
                        onChange={(e) => {
                            const newProfile = { ...profile, bio: e.target.value };
                            setProfile(newProfile);
                            handleAutoSave(newProfile);
                        }}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    />
                    <Text className="text-gray-500 dark:text-gray-400">
                        {t('tutors.profile.about.tip')}
                    </Text>
                </div>
            </section>

            {/* Education Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <Title level={3} className="text-gray-800 dark:text-gray-100 mb-4">
                    {t('tutors.profile.education')}
                </Title>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            placeholder={t('tutors.profile.education_degree_placeholder')}
                            value={newEducation.degree}
                            onChange={(value) => setNewEducation(prev => ({ ...prev, degree: value }))}
                            className="w-full dark:bg-gray-700 dark:text-gray-100"
                        >
                            {EDUCATION_DEGREES.map(degree => (
                                <Select.Option key={degree} value={degree}>{degree}</Select.Option>
                            ))}
                        </Select>
                        <Input
                            placeholder={t('tutors.profile.education_institution_placeholder')}
                            value={newEducation.institution}
                            onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                            className="w-full dark:bg-gray-700 dark:text-gray-100"
                        />
                        <Input
                            placeholder={t('tutors.profile.education_field_placeholder')}
                            value={newEducation.field_of_study}
                            onChange={(e) => setNewEducation(prev => ({ ...prev, field_of_study: e.target.value }))}
                            className="w-full dark:bg-gray-700 dark:text-gray-100"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                placeholder={t('tutors.profile.education.start_year.placeholder')}
                                value={newEducation.start_year}
                                onChange={(e) => setNewEducation(prev => ({ ...prev, start_year: e.target.value }))}
                                className="w-full dark:bg-gray-700 dark:text-gray-100"
                            />
                            <Input
                                placeholder={t('tutors.profile.education.end_year.placeholder')}
                                value={newEducation.end_year}
                                onChange={(e) => setNewEducation(prev => ({ ...prev, end_year: e.target.value }))}
                                className="w-full dark:bg-gray-700 dark:text-gray-100"
                            />
                        </div>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            if (newEducation.degree && newEducation.institution) {
                                const newProfile = {
                                    ...profile,
                                    education: [...profile.education, newEducation]
                                };
                                setProfile(newProfile);
                                handleAutoSave(newProfile);
                                setNewEducation({
                                    degree: '',
                                    institution: '',
                                    field_of_study: '',
                                    start_year: '',
                                    end_year: ''
                                });
                            }
                        }}
                    >
                        {t('tutors.profile.education.add')}
                    </Button>
                    <div className="space-y-2">
                        {profile.education.map((edu, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div>
                                    <Tag color="blue">{edu.degree}</Tag>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                                        {edu.institution} - {edu.field_of_study}
                                    </span>
                                    <span className="ml-2 text-gray-500">
                                        ({edu.start_year} - {edu.end_year})
                                    </span>
                                </div>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        const newProfile = {
                                            ...profile,
                                            education: profile.education.filter((_, i) => i !== index)
                                        };
                                        setProfile(newProfile);
                                        handleAutoSave(newProfile);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Teaching Languages Section */}
            <section className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <Title level={3} className="text-gray-800 dark:text-gray-100 mb-4">
                    Languages I Teach
                </Title>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select
                            placeholder="Select a language"
                            value={newLanguage.language}
                            onChange={(value) => setNewLanguage(prev => ({ ...prev, language: value }))}
                            className="w-full dark:bg-gray-700 dark:text-gray-100"
                        >
                            {LANGUAGES.map(lang => (
                                <Select.Option key={lang} value={lang}>{lang}</Select.Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Select proficiency level"
                            value={newLanguage.level}
                            onChange={(value) => setNewLanguage(prev => ({ ...prev, level: value }))}
                            className="w-full dark:bg-gray-700 dark:text-gray-100"
                        >
                            {LANGUAGE_LEVELS.map(level => (
                                <Select.Option key={level} value={level}>{level}</Select.Option>
                            ))}
                        </Select>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            if (newLanguage.language && newLanguage.level) {
                                const newProfile = {
                                    ...profile,
                                    teachingLanguages: [...profile.teachingLanguages, newLanguage]
                                };
                                setProfile(newProfile);
                                handleAutoSave(newProfile);
                                setNewLanguage({ language: '', level: '' });
                            }
                        }}
                    >
                        Add Language
                    </Button>
                    <div className="space-y-2">
                        {profile.teachingLanguages.map((lang, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                                <div>
                                    <Tag color="blue">{lang.language}</Tag>
                                    <span className="ml-2 text-gray-600 dark:text-gray-300">{lang.level}</span>
                                </div>
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                        const newProfile = {
                                            ...profile,
                                            teachingLanguages: profile.teachingLanguages.filter((_, i) => i !== index)
                                        };
                                        setProfile(newProfile);
                                        handleAutoSave(newProfile);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Video Introduction Section */}
            <section id="video" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                <Title level={3} className="text-gray-800 dark:text-gray-100 mb-4">
                    Video Introduction
                </Title>
                <div className="space-y-4">
                    {profile.introductionVideo ? (
                        <div>
                            <video
                                controls
                                src={profile.introductionVideo}
                                className="max-w-full h-auto rounded-lg"
                            />
                            <Button
                                onClick={() => {
                                    const newProfile = { ...profile, introductionVideo: '' };
                                    setProfile(newProfile);
                                    handleAutoSave(newProfile);
                                }}
                                danger
                                className="mt-2"
                            >
                                Remove Video
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <Upload
                                accept="video/*"
                                beforeUpload={file => {
                                    handleVideoUpload(file);
                                    return false;
                                }}
                                showUploadList={false}
                            >
                                <Button icon={<UploadOutlined />}>Upload Video</Button>
                            </Upload>
                            <Text className="block mt-2 text-gray-500 dark:text-gray-400">
                                Upload a short video (max 5 minutes) introducing yourself to potential students.
                                Maximum file size: 50MB
                            </Text>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}; 