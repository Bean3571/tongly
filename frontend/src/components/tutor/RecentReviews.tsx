import React from 'react';
import { Card } from 'antd';
import { StarOutlined } from '@ant-design/icons';
import { formatDateTime } from '../../utils/dateUtils';

interface Review {
    id: number;
    student_name: string;
    rating: number;
    comment: string;
    created_at: string;
}

interface RecentReviewsProps {
    reviews: Review[];
}

export const RecentReviews: React.FC<RecentReviewsProps> = ({ reviews }) => {
    return (
        <Card title="Recent Reviews" className="h-full">
            {reviews.map((review) => (
                <div key={review.id} className="mb-4 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-medium">{review.student_name}</div>
                            <div className="text-sm text-gray-500">
                                {formatDateTime(review.created_at)}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <StarOutlined className="text-yellow-400 mr-1" />
                            <span>{review.rating}</span>
                        </div>
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
            ))}
            {reviews.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                    No reviews yet
                </div>
            )}
        </Card>
    );
}; 