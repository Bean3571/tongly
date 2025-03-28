import React from 'react';
import { Typography, Alert, Card, Tabs, Switch, Select, Button, Form, Input } from 'antd';
import { 
    BellOutlined, 
    LockOutlined, 
    GlobalOutlined, 
    DollarOutlined 
} from '@ant-design/icons';
import { useTranslation } from '../contexts/I18nContext';

const { Title } = Typography;
const { TabPane } = Tabs;

export const Settings: React.FC = () => {
    const { t, currentLanguage, changeLanguage } = useTranslation();

    const handleLanguageChange = (value: string) => {
        changeLanguage(value);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Alert
                message="PLACEHOLDER"
                description="This is a placeholder for the Settings page"
                type="warning"
                className="mb-6"
            />
            
            <Title level={2} className="mb-6">{t('pages.settings.title')}</Title>
            
            <Card className="bg-white shadow-lg">
                <Tabs defaultActiveKey="notifications">
                    <TabPane
                        tab={
                            <span>
                                <BellOutlined />
                                {t('pages.settings.notifications.title')}
                            </span>
                        }
                        key="notifications"
                    >
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">{t('pages.settings.notifications.email.title')}</h3>
                                    <p className="text-gray-500">{t('pages.settings.notifications.email.description')}</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">{t('pages.settings.notifications.sms.title')}</h3>
                                    <p className="text-gray-500">{t('pages.settings.notifications.sms.description')}</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium">{t('pages.settings.notifications.marketing.title')}</h3>
                                    <p className="text-gray-500">{t('pages.settings.notifications.marketing.description')}</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <LockOutlined />
                                {t('pages.settings.security.title')}
                            </span>
                        }
                        key="security"
                    >
                        <Form layout="vertical">
                            <Form.Item label={t('pages.settings.security.current.password')}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label={t('pages.settings.security.new.password')}>
                                <Input.Password />
                            </Form.Item>
                            <Form.Item label={t('pages.settings.security.confirm.password')}>
                                <Input.Password />
                            </Form.Item>
                            <Button type="primary">Update Password</Button>
                        </Form>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <GlobalOutlined />
                                {t('pages.settings.language.title')}
                            </span>
                        }
                        key="language"
                    >
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium mb-2">{t('pages.settings.language.selectLanguage')}</h3>
                                <Select
                                    value={currentLanguage}
                                    onChange={handleLanguageChange}
                                    style={{ width: 200 }}
                                >
                                    <Select.Option value="en">English</Select.Option>
                                    <Select.Option value="ru">Русский</Select.Option>
                                    <Select.Option value="es">Español</Select.Option>
                                </Select>
                            </div>
                        </div>
                    </TabPane>
                </Tabs>
            </Card>
        </div>
    );
}; 