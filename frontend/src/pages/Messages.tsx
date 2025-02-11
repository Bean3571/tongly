import React from 'react';
import { Typography, Alert, Card, List, Avatar, Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Search } = Input;

const MOCK_MESSAGES = [
    {
        id: 1,
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?img=1',
        lastMessage: 'Looking forward to our next lesson!',
        time: '5m ago',
        unread: true,
    },
    {
        id: 2,
        name: 'Jane Smith',
        avatar: 'https://i.pravatar.cc/150?img=2',
        lastMessage: 'Thank you for the great lesson',
        time: '1h ago',
        unread: false,
    },
    // Add more mock messages...
];

export const Messages: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <Alert
                message="PLACEHOLDER"
                description="This is a placeholder for the Messages page"
                type="warning"
                className="mb-6"
            />
            
            <Title level={2} className="mb-6">Messages</Title>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <Search
                        placeholder="Search conversations..."
                        className="mb-4"
                    />
                    <List
                        dataSource={MOCK_MESSAGES}
                        renderItem={item => (
                            <List.Item 
                                className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 ${
                                    item.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar src={item.avatar} />}
                                    title={<span className="font-medium">{item.name}</span>}
                                    description={
                                        <div className="flex justify-between">
                                            <span className="text-gray-500 truncate">{item.lastMessage}</span>
                                            <span className="text-xs text-gray-400">{item.time}</span>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>

                <Card className="lg:col-span-2">
                    <div className="flex flex-col h-[600px]">
                        <div className="border-b pb-4 mb-4">
                            <div className="flex items-center">
                                <Avatar src="https://i.pravatar.cc/150?img=1" className="mr-3" />
                                <div>
                                    <h3 className="font-medium">John Doe</h3>
                                    <span className="text-sm text-gray-500">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-4">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <div className="bg-blue-500 text-white rounded-lg p-3 max-w-[70%]">
                                        Hello! How can I help you today?
                                    </div>
                                </div>
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 max-w-[70%]">
                                        I'd like to schedule a lesson for next week.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Input placeholder="Type your message..." />
                            <Button type="primary" icon={<SendOutlined />}>Send</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}; 