import React from 'react';
import { Typography, Row, Col, Card, Button, Progress, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTutorDashboard } from '../hooks/useTutorDashboard';
import { StatsCards } from '../components/dashboard/StatsCards';
import { UpcomingLessonsTable } from '../components/dashboard/UpcomingLessonsTable';
import { RecentReviews } from '../components/dashboard/RecentReviews';
import { QuickActions } from '../components/dashboard/QuickActions';
import { 
    EditOutlined, 
    CalendarOutlined, 
    CheckCircleOutlined,
    WarningOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TutorDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { loading, stats, upcomingLessons = [], recentReviews = [] } = useTutorDashboard();

    const getProfileCompletionStatus = () => {
        const requiredFields = [
            { 
                name: 'Bio', 
                completed: Boolean(stats.bio?.trim()), 
                path: '/tutor/profile' 
            },
            { 
                name: 'Teaching Languages', 
                completed: Boolean(Array.isArray(stats.teachingLanguages) && stats.teachingLanguages.length > 0), 
                path: '/tutor/profile' 
            },
            { 
                name: 'Schedule', 
                completed: Boolean(stats.hasSchedule), 
                path: '/schedule' 
            }
        ];

        const completedCount = requiredFields.filter(field => field.completed).length;
        const percentage = Math.round((completedCount / requiredFields.length) * 100);

        return {
            percentage,
            incompleteFields: requiredFields.filter(field => !field.completed)
        };
    };

    const profileStatus = getProfileCompletionStatus();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center mb-6">
                <Title level={2} className="!text-gray-800 dark:!text-gray-100 !mb-0">
                    Dashboard
                </Title>
                <Button 
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => navigate('/tutor/profile')}
                >
                    Edit Profile
                </Button>
            </div>
            
            {/* Profile Completion Alert */}
            {profileStatus.percentage < 100 && (
                <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800 mb-6">
                    <div className="flex items-start">
                        <WarningOutlined className="text-blue-500 text-lg mt-1 mr-4" />
                        <div className="flex-1">
                            <h3 className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                                Complete Your Profile
                            </h3>
                            <Progress 
                                percent={profileStatus.percentage} 
                                status="active"
                                strokeColor="#3B82F6"
                            />
                            <div className="mt-2 text-blue-600 dark:text-blue-300">
                                Complete these items to increase your visibility to students:
                                <ul className="list-disc ml-5 mt-1">
                                    {profileStatus.incompleteFields.map(field => (
                                        <li 
                                            key={field.name}
                                            className="cursor-pointer hover:underline"
                                            onClick={() => navigate(field.path)}
                                        >
                                            {field.name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
            
            <StatsCards stats={stats} loading={loading} />
            
            <Row gutter={[24, 24]} className="mt-6">
                <Col xs={24} xl={16}>
                    <Card 
                        title={
                            <div className="flex items-center !text-gray-800 dark:!text-gray-100">
                                <CalendarOutlined className="mr-2" />
                                Upcoming Lessons
                            </div>
                        }
                        extra={
                            <Button onClick={() => navigate('/schedule')}>
                                Manage Schedule
                            </Button>
                        }
                        className="shadow-md dark:bg-gray-800 dark:border-gray-700"
                        bordered={false}
                    >
                        {upcomingLessons.length > 0 ? (
                            <UpcomingLessonsTable 
                                lessons={upcomingLessons} 
                                loading={loading} 
                            />
                        ) : (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div className="text-gray-500 dark:text-gray-400">
                                        No upcoming lessons
                                        <Button 
                                            type="link" 
                                            onClick={() => navigate('/schedule')}
                                            className="block mx-auto mt-2"
                                        >
                                            Set your availability
                                        </Button>
                                    </div>
                                }
                            />
                        )}
                    </Card>

                    {/* Recent Activity */}
                    <Card 
                        title={
                            <div className="flex items-center !text-gray-800 dark:!text-gray-100">
                                <CheckCircleOutlined className="mr-2" />
                                Recent Activity
                            </div>
                        }
                        className="mt-6 shadow-md dark:bg-gray-800 dark:border-gray-700"
                        bordered={false}
                    >
                        <div className="space-y-4">
                            {stats.recentActivity?.map((activity, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <Text className="!text-gray-800 dark:!text-gray-100">
                                            {activity.description}
                                        </Text>
                                        <Text className="block text-sm !text-gray-500 dark:!text-gray-400">
                                            {activity.time}
                                        </Text>
                                    </div>
                                    {activity.action && (
                                        <Button 
                                            size="small" 
                                            onClick={() => {
                                                if (activity.action) {
                                                    navigate(activity.action.path);
                                                }
                                            }}
                                            className="dark:border-gray-600 dark:text-gray-300 dark:hover:text-white"
                                        >
                                            {activity.action.label}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>
                
                <Col xs={24} xl={8}>
                    <QuickActions />

                    <Card 
                        title={
                            <div className="flex items-center !text-gray-800 dark:!text-gray-100">
                                <CheckCircleOutlined className="mr-2" />
                                Recent Reviews
                            </div>
                        }
                        className="mt-6 shadow-md dark:bg-gray-800 dark:border-gray-700"
                        bordered={false}
                    >
                        <RecentReviews 
                            reviews={recentReviews} 
                            loading={loading} 
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default TutorDashboard; 