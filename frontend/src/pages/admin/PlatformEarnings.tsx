import React, { useState, useEffect } from 'react';
import { Card, Table, DatePicker, Button, Statistic, Row, Col, Typography, Select } from 'antd';
import { 
    DollarOutlined, 
    PercentageOutlined, 
    DownloadOutlined 
} from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import { platformEarningsService, PlatformEarning, EarningsSummary } from '../../services/platformEarningsService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export const PlatformEarnings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState<PlatformEarning[]>([]);
    const [summary, setSummary] = useState<EarningsSummary>({
        totalEarnings: 0,
        totalTransactions: 0,
        averageCommission: 0
    });
    const [dateRange, setDateRange] = useState(platformEarningsService.getDefaultDateRange());

    useEffect(() => {
        loadEarningsData();
    }, [dateRange]);

    const loadEarningsData = async () => {
        try {
            setLoading(true);
            const data = await platformEarningsService.getEarnings({
                startDate: platformEarningsService.formatDate(dateRange[0]),
                endDate: platformEarningsService.formatDate(dateRange[1]),
                currency: 'RUB'
            });

            setEarnings(data.earnings);
            setSummary(data.summary);
        } catch (error) {
            console.error('Error loading earnings data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            await platformEarningsService.exportEarnings({
                startDate: platformEarningsService.formatDate(dateRange[0]),
                endDate: platformEarningsService.formatDate(dateRange[1]),
                currency: 'RUB'
            });
        } catch (error) {
            console.error('Error exporting data:', error);
        }
    };

    const columns = [
        {
            title: 'ID транзакции',
            dataIndex: 'transaction_id',
            key: 'transaction_id',
        },
        {
            title: 'Комиссия',
            dataIndex: 'commission_amount',
            key: 'commission_amount',
            render: (amount: number) => platformEarningsService.formatRUB(amount),
        },
        {
            title: 'Валюта',
            dataIndex: 'currency',
            key: 'currency',
        },
        {
            title: 'Дата',
            dataIndex: 'processed_at',
            key: 'processed_at',
            render: (date: string) => platformEarningsService.formatDateTime(date),
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <Title level={2} className="dark:text-gray-100">
                    Доходы платформы
                </Title>
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExport}
                >
                    Экспорт
                </Button>
            </div>

            <Row gutter={[16, 16]} className="mb-8">
                <Col xs={24} sm={8}>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <Statistic
                            title={<Text className="dark:text-gray-300">Общий доход</Text>}
                            value={summary.totalEarnings}
                            precision={2}
                            prefix={<DollarOutlined />}
                            suffix="₽"
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <Statistic
                            title={<Text className="dark:text-gray-300">Количество транзакций</Text>}
                            value={summary.totalTransactions}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <Statistic
                            title={<Text className="dark:text-gray-300">Средняя комиссия</Text>}
                            value={summary.averageCommission}
                            precision={2}
                            prefix={<PercentageOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="dark:bg-gray-800 dark:border-gray-700 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4} className="dark:text-gray-100 mb-0">
                        Фильтры
                    </Title>
                </div>
                <div className="flex gap-4">
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => {
                            if (dates) {
                                setDateRange([dates[0]!, dates[1]!]);
                            }
                        }}
                        className="w-64"
                    />
                    <Select
                        defaultValue="RUB"
                        className="w-32"
                        options={[
                            { value: 'RUB', label: 'RUB' }
                        ]}
                    />
                </div>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <Table
                    columns={columns}
                    dataSource={earnings}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        total: earnings.length,
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Всего: ${total} записей`,
                    }}
                    className="dark:text-gray-100"
                />
            </Card>
        </div>
    );
}; 