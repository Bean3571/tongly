import React from 'react';
import { Card, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Update Teaching Profile',
            path: '/profile',
        },
        {
            label: 'Manage Availability',
            path: '/availability',
        },
        {
            label: 'View Earnings',
            path: '/wallet',
        },
        {
            label: 'View All Lessons',
            path: '/lessons',
        },
    ];

    return (
        <Card title="Quick Actions" className="h-full">
            <div className="space-y-4">
                {actions.map((action) => (
                    <Button
                        key={action.path}
                        block
                        size="large"
                        onClick={() => navigate(action.path)}
                    >
                        {action.label}
                    </Button>
                ))}
            </div>
        </Card>
    );
}; 