import React from 'react';
import { Table, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Lesson } from '../../hooks/useTutorDashboard';
import { format } from 'date-fns';

interface UpcomingLessonsTableProps {
    lessons: Lesson[];
    loading: boolean;
}

export const UpcomingLessonsTable: React.FC<UpcomingLessonsTableProps> = ({ lessons, loading }) => {
    const navigate = useNavigate();

    const columns = [
        {
            title: 'Student',
            dataIndex: 'student_name',
            key: 'student_name',
        },
        {
            title: 'Date & Time',
            dataIndex: 'start_time',
            key: 'start_time',
            render: (start_time: string) => format(new Date(start_time), 'PPp'),
        },
        {
            title: 'Duration',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration: number) => `${duration} minutes`,
        },
        {
            title: 'Language',
            dataIndex: 'language',
            key: 'language',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                let color = 'default';
                switch (status.toLowerCase()) {
                    case 'scheduled':
                        color = 'blue';
                        break;
                    case 'in_progress':
                        color = 'green';
                        break;
                    case 'completed':
                        color = 'gray';
                        break;
                    case 'cancelled':
                        color = 'red';
                        break;
                }
                return <Tag color={color}>{status.replace('_', ' ').toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Lesson) => (
                <Button
                    type="primary"
                    onClick={() => navigate(`/lessons/${record.id}`)}
                >
                    {record.status === 'in_progress' ? 'Join Now' : 'View Details'}
                </Button>
            ),
        },
    ];

    return (
        <Table
            columns={columns}
            dataSource={lessons}
            loading={loading}
            rowKey="id"
            pagination={{
                pageSize: 5,
                hideOnSinglePage: true,
            }}
        />
    );
}; 