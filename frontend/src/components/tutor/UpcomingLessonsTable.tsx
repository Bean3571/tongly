import React from 'react';
import { Table, Tag, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, getTimeStatus } from '../../utils/dateUtils';

interface Lesson {
    id: number;
    student_name: string;
    start_time: string;
    duration: number;
    language: string;
    status: string;
}

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
            render: (text: string) => formatDateTime(text),
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
            render: (status: string, record: Lesson) => {
                const color = 
                    status === 'scheduled' ? 'blue' :
                    status === 'in_progress' ? 'green' :
                    status === 'completed' ? 'gray' : 'red';
                
                return (
                    <Tag color={color}>
                        {getTimeStatus(record.start_time, status)}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: string, record: Lesson) => (
                <Button 
                    type="primary"
                    onClick={() => navigate(`/lessons/${record.id}`)}
                    disabled={record.status !== 'scheduled' && record.status !== 'in_progress'}
                >
                    Join
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
            pagination={{ pageSize: 5 }}
        />
    );
}; 