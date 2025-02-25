import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Modal, Tabs, Select, Spin, Result, Button, Typography, Switch, Badge } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { LessonList } from '../components/lessons/LessonList';
import { useLessons, Lesson } from '../hooks/useLessons';

const { Text } = Typography;
const { TabPane } = Tabs;

export const Lessons: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

    // Enable auto-refresh only for upcoming lessons
    const shouldAutoRefresh = activeTab === 'upcoming' && autoRefresh;
    
    const { lessons = [], loading, error, refreshLessons, cancelLesson } = useLessons({
        type: activeTab,
        autoRefresh: shouldAutoRefresh,
    });

    // Reset retry count when the tab changes
    useEffect(() => {
        setRetryCount(0);
    }, [activeTab]);
    
    // Force-retry on error after a few seconds, but only a limited number of times
    useEffect(() => {
        if (error && retryCount < 3) {
            const timer = setTimeout(() => {
                console.log(`Auto-retrying lesson fetch (attempt ${retryCount + 1})...`);
                refreshLessons();
                setRetryCount(prev => prev + 1);
            }, 3000); // Wait 3 seconds before retry
            
            return () => clearTimeout(timer);
        }
    }, [error, retryCount, refreshLessons]);

    const filteredLessons = React.useMemo(() => {
        if (!Array.isArray(lessons)) {
            console.error('Lessons is not an array:', lessons);
            return [];
        }
        
        return lessons.filter(lesson => {
            // Make sure the lesson has valid data
            if (!lesson || typeof lesson !== 'object' || !lesson.id) {
                console.error('Invalid lesson object:', lesson);
                return false;
            }
            
            if (filter === 'all') return true;
            return lesson.status === filter;
        });
    }, [lessons, filter]);

    const handleCancelLesson = (lesson: Lesson) => {
        if (!user) return;
        
        Modal.confirm({
            title: 'Cancel Lesson',
            icon: <ExclamationCircleOutlined />,
            content: (
                <div>
                    <p>Are you sure you want to cancel this lesson?</p>
                    <p className="text-gray-500 mt-2">
                        This action cannot be undone.
                    </p>
                </div>
            ),
            okText: 'Yes, Cancel Lesson',
            okButtonProps: { danger: true },
            cancelText: 'No, Keep Lesson',
            onOk: () => cancelLesson(lesson.id, `Cancelled by ${user.credentials.role}`),
        });
    };

    if (!user) {
        navigate('/login');
        return null;
    }

    const handleManualRefresh = () => {
        setRetryCount(0);
        setLastRefreshTime(new Date());
        refreshLessons();
    };

    const renderErrorState = () => (
        <Result
            status="error"
            title="Failed to Load Lessons"
            subTitle={
                <div>
                    <Text type="danger">{error}</Text>
                    <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                        {retryCount > 0 ? `Retry attempt ${retryCount} of 3` : ''}
                    </Text>
                </div>
            }
            extra={[
                <Button
                    key="retry"
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleManualRefresh}
                    loading={loading}
                >
                    Try Again
                </Button>
            ]}
        />
    );

    const renderLoadingState = () => (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <Spin size="large" />
                <div className="mt-4 text-gray-500">Loading your lessons...</div>
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="flex flex-col justify-center items-center h-64">
            <div className="text-center text-gray-500 mb-4">
                {filter === 'all' ? 'No lessons found' : `No ${filter} lessons found`}
            </div>
            <Button 
                icon={<ReloadOutlined />} 
                onClick={handleManualRefresh} 
                type="default"
                size="small"
            >
                Refresh
            </Button>
        </div>
    );

    const renderLessonList = () => (
        <div>
            {shouldAutoRefresh && (
                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-300">
                    <InfoCircleOutlined className="mr-2" />
                    <span>Auto-refreshing every 30 seconds. Last refreshed: {lastRefreshTime.toLocaleTimeString()}</span>
                </div>
            )}
            <LessonList
                lessons={filteredLessons}
                userRole={user.credentials.role}
                onCancelLesson={handleCancelLesson}
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Lessons</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeTab === 'upcoming' ? 'Manage your upcoming lessons' : 'View your lesson history'}
                    </p>
                </div>
                <div className="flex space-x-4 items-center">
                    {activeTab === 'upcoming' && (
                        <div className="flex items-center mr-4">
                            <Switch 
                                size="small" 
                                checked={autoRefresh} 
                                onChange={setAutoRefresh} 
                                className="mr-2" 
                            />
                            <Text type="secondary" className="text-xs">
                                Auto Refresh
                            </Text>
                        </div>
                    )}
                    <Button 
                        type="default"
                        icon={<ReloadOutlined />} 
                        onClick={handleManualRefresh}
                        loading={loading}
                        size="small"
                    >
                        Refresh
                    </Button>
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => setActiveTab(key as 'upcoming' | 'completed')}
                        className="mb-0"
                    >
                        <TabPane tab="Upcoming" key="upcoming">
                            {/* Content rendered below */}
                        </TabPane>
                        <TabPane tab="Past" key="completed">
                            {/* Content rendered below */}
                        </TabPane>
                    </Tabs>
                    <Select
                        value={filter}
                        onChange={(value) => setFilter(value)}
                        className="min-w-[150px]"
                        options={[
                            { value: 'all', label: 'All Status' },
                            { value: 'scheduled', label: 'Scheduled' },
                            { value: 'in_progress', label: 'In Progress' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'cancelled', label: 'Cancelled' },
                        ]}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                {error ? (
                    renderErrorState()
                ) : loading && lessons.length === 0 ? (
                    renderLoadingState()
                ) : filteredLessons.length === 0 ? (
                    renderEmptyState()
                ) : (
                    renderLessonList()
                )}
            </div>
        </div>
    );
}; 