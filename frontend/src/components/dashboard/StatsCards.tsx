import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, StarOutlined, TeamOutlined, BookOutlined, CalendarOutlined, WarningOutlined } from '@ant-design/icons';
import { DashboardStats } from '../../hooks/useTutorDashboard';

interface StatsCardsProps {
    stats: DashboardStats;
    loading: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
                <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <Statistic
                        loading={loading}
                        title={<span className="dark:text-gray-300">Your Rating</span>}
                        value={stats.averageRating}
                        prefix={<StarOutlined className="dark:text-gray-300" />}
                        precision={1}
                        suffix="/5"
                        valueStyle={{ color: '#faad14', fontSize: '24px' }}
                        className="dark:text-gray-100"
                    />
                </Card>
            </Col>
        </Row>
    );
}; 