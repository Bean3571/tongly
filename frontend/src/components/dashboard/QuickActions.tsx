import React from 'react';
import { Card, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
    ProfileOutlined,
    CalendarOutlined,
    SettingOutlined,
    EditOutlined
} from '@ant-design/icons';

export const QuickActions: React.FC = () => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Edit Teaching Profile',
            icon: <ProfileOutlined />,
            path: '/tutor/profile',
            description: 'Update your bio, languages, and education',
            primary: true
        },
        {
            label: 'Manage Schedule',
            icon: <CalendarOutlined />,
            path: '/schedule',
            description: 'Set your availability and teaching hours'
        },
        {
            label: 'Account Settings',
            icon: <SettingOutlined />,
            path: '/settings',
            description: 'Manage your account preferences'
        }
    ];

    const handleActionClick = (path: string) => {
        if (path.includes('#')) {
            const [basePath, section] = path.split('#');
            navigate(basePath, { state: { section } });
        } else {
            navigate(path);
        }
    };

    return (
        <Card 
            title={
                <div className="flex items-center text-gray-800 dark:text-gray-100">
                    <EditOutlined className="mr-2" />
                    Quick Actions
                </div>
            }
            className="shadow-md dark:bg-gray-800 dark:border-gray-700"
            bordered={false}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {actions.map((action) => (
                    <Button
                        key={action.path}
                        type={action.primary ? "primary" : "default"}
                        icon={action.icon}
                        onClick={() => handleActionClick(action.path)}
                        className={`w-full flex items-center justify-start px-4 py-6 h-auto ${
                            !action.primary && 'dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                        }`}
                    >
                        <div className="text-left">
                            <div className="font-medium">{action.label}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {action.description}
                            </div>
                        </div>
                    </Button>
                ))}
            </Space>
        </Card>
    );
}; 