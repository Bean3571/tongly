import { apiClient } from '../api/client';

export interface Transaction {
    id: number;
    amount: number;
    commission_amount: number;
    net_amount: number;
    transaction_type: 'deposit' | 'withdrawal' | 'lesson_payment';
    status: 'pending' | 'completed' | 'failed';
    currency: string;
    created_at: string;
}

export interface WalletBalance {
    balance: number;
    currency: string;
}

export interface TransactionRequest {
    amount: number;
    currency?: string;
}

class WalletService {
    async getBalance(): Promise<WalletBalance> {
        const response = await apiClient.get<WalletBalance>('/api/wallet/balance');
        return response.data;
    }

    async getTransactions(): Promise<Transaction[]> {
        try {
            const response = await apiClient.get<{ transactions: Transaction[] }>('/api/wallet/transactions');
            // Ensure we always return an array
            return Array.isArray(response.data.transactions) ? response.data.transactions : [];
        } catch (error) {
            console.error('Error fetching transactions:', error);
            return [];
        }
    }

    async deposit(amount: number): Promise<Transaction> {
        const response = await apiClient.post<Transaction>('/api/wallet/deposit', { amount });
        return response.data;
    }

    async withdraw(amount: number): Promise<Transaction> {
        const response = await apiClient.post<Transaction>('/api/wallet/withdraw', { amount });
        return response.data;
    }

    formatRUB(amount: number): string {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2
        }).format(amount);
    }

    validateAmount(amount: number): boolean {
        return !isNaN(amount) && amount > 0 && amount <= 1000000;
    }

    validateWithdrawal(amount: number, balance: number): boolean {
        return this.validateAmount(amount) && amount <= balance;
    }
}

export const walletService = new WalletService(); 