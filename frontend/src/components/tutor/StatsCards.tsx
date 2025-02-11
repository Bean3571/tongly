import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
    DollarOutlined, 
    StarOutlined, 
    UserOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined
} from '@ant-design/icons';

interface DashboardStats {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    totalEarnings: number;
    averageRating: number;
    totalStudents: number;
}

interface StatsCardsProps {
    stats: DashboardStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
    return (
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Total Earnings"
                        value={stats.totalEarnings}
                        prefix={<DollarOutlined />}
                        precision={2}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Average Rating"
                        value={stats.averageRating}
                        prefix={<StarOutlined />}
                        precision={1}
                        suffix="/5"
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Total Students"
                        value={stats.totalStudents}
                        prefix={<UserOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Completed Lessons"
                        value={stats.completedLessons}
                        prefix={<CheckCircleOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Upcoming Lessons"
                        value={stats.upcomingLessons}
                        prefix={<CalendarOutlined />}
                    />
                </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
                <Card>
                    <Statistic
                        title="Cancellation Rate"
                        value={(stats.totalLessons - stats.completedLessons) / stats.totalLessons * 100 || 0}
                        prefix={<CloseCircleOutlined />}
                        precision={1}
                        suffix="%"
                    />
                </Card>
            </Col>
        </Row>
    );
}; 