import React from 'react';
import { Card, Rate, List, Typography, Empty } from 'antd';
import { format } from 'date-fns';
import { Review } from '../../hooks/useTutorDashboard';

const { Text } = Typography;

interface RecentReviewsProps {
    reviews: Review[];
    loading: boolean;
}

export const RecentReviews: React.FC<RecentReviewsProps> = ({ reviews, loading }) => {
    if (!loading && reviews.length === 0) {
        return (
            <Card title="Recent Reviews" className="dark:bg-gray-800 dark:border-gray-700">
                <Empty description={<span className="dark:text-gray-400">No reviews yet</span>} />
            </Card>
        );
    }

    return (
        <Card 
            title="Recent Reviews" 
            loading={loading}
            className="dark:bg-gray-800 dark:border-gray-700"
        >
            <List
                itemLayout="vertical"
                dataSource={reviews}
                renderItem={(review) => (
                    <List.Item>
                        <List.Item.Meta
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text strong className="dark:text-gray-100">{review.student_name}</Text>
                                    <Text type="secondary" className="dark:text-gray-400">
                                        {format(new Date(review.created_at), 'PP')}
                                    </Text>
                                </div>
                            }
                            description={
                                <Rate 
                                    disabled 
                                    value={review.rating} 
                                    style={{ fontSize: 16 }}
                                    className="dark:text-yellow-500"
                                />
                            }
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text className="dark:text-gray-300">{review.comment}</Text>
                        </div>
                    </List.Item>
                )}
                pagination={{
                    pageSize: 3,
                    hideOnSinglePage: true,
                }}
                className="dark:text-gray-100"
            />
        </Card>
    );
}; 