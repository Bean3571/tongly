import React from 'react';
import { Typography, Alert, Card, Calendar, Badge } from 'antd';

const { Title } = Typography;

export const Schedule: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto p-6">
            <Alert
                message="PLACEHOLDER"
                description="This is a placeholder for the Schedule Management page"
                type="warning"
                className="mb-6"
            />
            
            <Title level={2} className="mb-6">Teaching Schedule</Title>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Quick Actions" className="lg:col-span-1">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <h3 className="font-medium mb-2">Set Weekly Hours</h3>
                            <p className="text-gray-600 dark:text-gray-400">Define your regular teaching hours</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <h3 className="font-medium mb-2">Block Time Off</h3>
                            <p className="text-gray-600 dark:text-gray-400">Mark dates when you're unavailable</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                            <h3 className="font-medium mb-2">Time Zone</h3>
                            <p className="text-gray-600 dark:text-gray-400">Update your teaching time zone</p>
                        </div>
                    </div>
                </Card>

                <Card className="lg:col-span-2">
                    <Calendar 
                        fullscreen={false}
                        dateCellRender={(date) => {
                            // Placeholder data
                            const day = date.date();
                            if (day % 3 === 0) {
                                return <Badge status="success" text="Available" />;
                            }
                            if (day % 7 === 0) {
                                return <Badge status="error" text="Booked" />;
                            }
                            return null;
                        }}
                    />
                </Card>
            </div>
        </div>
    );
}; 