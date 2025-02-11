import { apiClient } from '../api/client';
import dayjs from 'dayjs';

export interface PlatformEarning {
    id: number;
    transaction_id: number;
    commission_amount: number;
    currency: string;
    processed_at: string;
}

export interface EarningsSummary {
    totalEarnings: number;
    totalTransactions: number;
    averageCommission: number;
}

export interface EarningsFilter {
    startDate: string;
    endDate: string;
    currency?: string;
}

class PlatformEarningsService {
    async getEarnings(filter: EarningsFilter): Promise<{
        earnings: PlatformEarning[];
        summary: EarningsSummary;
    }> {
        const params: Record<string, string> = {
            startDate: filter.startDate,
            endDate: filter.endDate,
        };
        
        if (filter.currency) {
            params.currency = filter.currency;
        }

        const response = await apiClient.get<{
            earnings: PlatformEarning[];
            totalEarnings: number;
            totalTransactions: number;
            averageCommission: number;
        }>('/admin/earnings', params);

        return {
            earnings: response.data.earnings,
            summary: {
                totalEarnings: response.data.totalEarnings,
                totalTransactions: response.data.totalTransactions,
                averageCommission: response.data.averageCommission,
            },
        };
    }

    async exportEarnings(filter: EarningsFilter): Promise<void> {
        const filename = `platform-earnings-${filter.startDate}-${filter.endDate}.csv`;
        await apiClient.downloadFile(
            `/admin/earnings/export?${new URLSearchParams({
                startDate: filter.startDate,
                endDate: filter.endDate,
                format: 'csv',
                ...(filter.currency && { currency: filter.currency }),
            })}`,
            filename
        );
    }

    formatRUB(amount: number): string {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2
        }).format(amount);
    }

    getDefaultDateRange(): [dayjs.Dayjs, dayjs.Dayjs] {
        return [
            dayjs().subtract(30, 'days'),
            dayjs()
        ];
    }

    formatDate(date: dayjs.Dayjs): string {
        return date.format('YYYY-MM-DD');
    }

    formatDateTime(date: string): string {
        return new Date(date).toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

export const platformEarningsService = new PlatformEarningsService(); 