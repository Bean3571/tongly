import { useState, useEffect } from 'react';
import { notification } from 'antd';

export interface DashboardStats {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    totalEarnings: number;
    averageRating: number;
    totalStudents: number;
    // Profile data
    bio?: string;
    teachingLanguages?: Array<{ language: string; level: string; }>;
    hasSchedule: boolean;
    // Recent activity
    recentActivity?: Array<{
        description: string;
        time: string;
        action?: {
            label: string;
            path: string;
        };
    }>;
}

export interface Lesson {
    id: number;
    student_name: string;
    start_time: string;
    duration: number;
    language: string;
    status: string;
}

export interface Review {
    id: number;
    student_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

export const useTutorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalLessons: 0,
        completedLessons: 0,
        upcomingLessons: 0,
        totalEarnings: 0,
        averageRating: 0,
        totalStudents: 0,
        hasSchedule: false,
        recentActivity: []
    });
    const [upcomingLessons, setUpcomingLessons] = useState<Lesson[]>([]);
    const [recentReviews, setRecentReviews] = useState<Review[]>([]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            };
            
            const [statsResponse, lessonsResponse, reviewsResponse, profileResponse] = await Promise.all([
                fetch('http://localhost:8080/api/tutors/stats', { headers }),
                fetch('http://localhost:8080/api/lessons/upcoming', { headers }),
                fetch('http://localhost:8080/api/tutors/reviews', { headers }),
                fetch('http://localhost:8080/api/tutors/profile', { headers })
            ]);

            let profileData = null;
            if (profileResponse.ok) {
                profileData = await profileResponse.json();
            }

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats({
                    ...statsData,
                    bio: profileData?.bio || '',
                    teachingLanguages: profileData?.teachingLanguages || [],
                    recentActivity: statsData.recentActivity || []
                });
            }

            if (lessonsResponse.ok) {
                const lessonsData = await lessonsResponse.json();
                setUpcomingLessons(lessonsData || []);
            }

            if (reviewsResponse.ok) {
                const reviewsData = await reviewsResponse.json();
                setRecentReviews(reviewsData || []);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            notification.error({
                message: 'Error',
                description: 'Failed to load dashboard data. Please try again.',
            });
            setStats(prev => ({ ...prev, recentActivity: [] }));
            setUpcomingLessons([]);
            setRecentReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    return {
        loading,
        stats,
        upcomingLessons,
        recentReviews,
        refreshData: loadDashboardData,
    };
}; 