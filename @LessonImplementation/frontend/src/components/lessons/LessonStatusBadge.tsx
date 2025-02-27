import React from 'react';
import { Tag } from 'antd';
import { useTranslation } from '../../contexts/I18nContext';

interface LessonStatusBadgeProps {
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export const LessonStatusBadge: React.FC<LessonStatusBadgeProps> = ({ status }) => {
    const { t } = useTranslation();

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'scheduled':
                return 'blue';
            case 'in_progress':
                return 'green';
            case 'completed':
                return 'purple';
            case 'cancelled':
                return 'red';
            default:
                return 'default';
        }
    };

    return (
        <Tag color={getStatusColor(status)}>
            {t(`lessons.status.${status}`)}
        </Tag>
    );
}; 