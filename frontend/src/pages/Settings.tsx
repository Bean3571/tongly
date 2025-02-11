import React from 'react';
import { Typography, Alert, Card, Tabs, Switch, Select, Button, Form, Input } from 'antd';
import { 
    BellOutlined, 
    LockOutlined, 
    GlobalOutlined, 
    DollarOutlined 
} from '@ant-design/icons';

const { Title } = Typography;
const { TabPane } = Tabs;

export const Settings: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <Alert
                message="PLACEHOLDER"
                description="This is a placeholder for the Settings page"
                type="warning"
                className="mb-6"
            />
            
            <Title level={2} className="mb-6">Settings</Title>
            
            <Card>
                <Tabs defaultActiveKey="notifications">
                    <TabPane
                        tab={
                            <span>
                                <BellOutlined />
                                Notifications
                            </span>
                        }
                        key="notifications"
                    >
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">Email Notifications</h3>
                                    <p className="text-gray-500">Receive email updates about your lessons</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">SMS Notifications</h3>
                                    <p className="text-gray-500">Get text messages for lesson reminders</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">Marketing Updates</h3>
                                    <p className="text-gray-500">Stay informed about new features and promotions</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <LockOutlined />
                                Security
                            </span>
                        }
                        key="security"
                    >
                        <Form layout="vertical">
                            <Form.Item label="Current Password">
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="New Password">
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label="Confirm New Password">
                                <Input.Password />
                            </Form.Item>
                            <Button type="primary">Update Password</Button>
                        </Form>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <GlobalOutlined />
                                Preferences
                            </span>
                        }
                        key="preferences"
                    >
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Language</h3>
                                <Select defaultValue="en" style={{ width: 200 }}>
                                    <Select.Option value="en">English</Select.Option>
                                    <Select.Option value="es">Spanish</Select.Option>
                                    <Select.Option value="fr">French</Select.Option>
                                </Select>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Time Zone</h3>
                                <Select defaultValue="utc" style={{ width: 200 }}>
                                    <Select.Option value="utc">UTC</Select.Option>
                                    <Select.Option value="est">Eastern Time</Select.Option>
                                    <Select.Option value="pst">Pacific Time</Select.Option>
                                </Select>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <DollarOutlined />
                                Billing
                            </span>
                        }
                        key="billing"
                    >
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">Payment Method</h3>
                                <Button>Add Payment Method</Button>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Billing History</h3>
                                <p className="text-gray-500">No billing history available</p>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}; 