import React from 'react';
import { Typography, Row, Col, Card, Button, Progress, Empty, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTutorDashboard } from '../hooks/useTutorDashboard';
import { StatsCards } from '../components/dashboard/StatsCards';
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
                <Title level={2} className="!text-gray-800 !mb-0">
                    Dashboard
                </Title>
            </div>
            
            
            <StatsCards stats={stats} loading={loading} />
            
            <Row gutter={[24, 24]} className="mt-6">
                
                <Col xs={24} xl={8}>
                    <QuickActions />

                </Col>
            </Row>
        </div>
    );
};

export default TutorDashboard; 