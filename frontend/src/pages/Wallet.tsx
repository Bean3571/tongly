import React, { useState, useEffect } from 'react';
import { Card, Button, Tabs, Spin, Alert, Modal, Input, Typography } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useTranslation } from '../contexts/I18nContext';
import { 
    WalletOutlined, 
    ArrowUpOutlined, 
    ArrowDownOutlined,
    ExclamationCircleOutlined 
} from '@ant-design/icons';
import { walletService, Transaction } from '../services/walletService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export const Wallet: React.FC = () => {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { t, formatCurrency } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [balance, setBalance] = useState(0);
    const [depositAmount, setDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        loadWalletData();
    }, []);

    const loadWalletData = async () => {
        try {
            setLoading(true);
            const [balanceData, transactionsData] = await Promise.all([
                walletService.getBalance(),
                walletService.getTransactions()
            ]);

            setBalance(balanceData?.balance || 0);
            setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
        } catch (error) {
            showNotification('error', 'Failed to load wallet data');
            setTransactions([]);
            setBalance(0);
        } finally {
            setLoading(false);
        }
    };

    const handleDeposit = async () => {
        try {
            setProcessingPayment(true);
            const amount = parseFloat(depositAmount);
            
            if (!walletService.validateAmount(amount)) {
                throw new Error(t('wallet.errors.invalidAmount'));
            }

            await walletService.deposit(amount);
            showNotification('success', t('wallet.depositSuccess'));
            setShowDepositModal(false);
            setDepositAmount('');
            loadWalletData();
        } catch (error) {
            showNotification('error', error instanceof Error ? error.message : t('wallet.errors.depositFailed'));
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleWithdraw = async () => {
        try {
            setProcessingPayment(true);
            const amount = parseFloat(withdrawAmount);
            
            if (!walletService.validateWithdrawal(amount, balance)) {
                throw new Error(t('wallet.errors.invalidAmount'));
            }

            await walletService.withdraw(amount);
            showNotification('success', t('wallet.withdrawalSuccess'));
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            await loadWalletData();
        } catch (error) {
            showNotification('error', error instanceof Error ? error.message : t('wallet.errors.withdrawalFailed'));
        } finally {
            setProcessingPayment(false);
        }
    };

    const getTransactionIcon = (type: string) => {
        switch (type) {
            case 'deposit':
                return <ArrowDownOutlined className="text-green-500" />;
            case 'withdrawal':
                return <ArrowUpOutlined className="text-red-500" />;
            default:
                return <WalletOutlined className="text-blue-500" />;
        }
    };

    const getTransactionLabel = (type: string) => {
        switch (type) {
            case 'deposit':
                return t('wallet.transactions.deposit');
            case 'withdrawal':
                return t('wallet.transactions.withdrawal');
            case 'lesson_payment':
                return t('wallet.transactions.lessonPayment');
            default:
                return type;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Title level={2} className="mb-8 dark:text-gray-100">{t('wallet.title')}</Title>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                    <Title level={4} className="text-white mb-4">{t('wallet.availableBalance')}</Title>
                    <div className="text-3xl font-bold mb-4">{formatCurrency(balance)}</div>
                    <div className="flex space-x-2">
                        {user?.credentials.role === 'student' && (
                            <Button 
                                type="primary" 
                                ghost 
                                onClick={() => setShowDepositModal(true)}
                                className="flex-1"
                            >
                                {t('wallet.deposit')}
                            </Button>
                        )}
                        {user?.credentials.role === 'tutor' && (
                            <Button 
                                ghost 
                                onClick={() => setShowWithdrawModal(true)}
                                className="flex-1"
                            >
                                {t('wallet.withdraw')}
                            </Button>
                        )}
                    </div>
                </Card>

                {user?.credentials.role === 'student' && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <Title level={4} className="dark:text-gray-100">{t('wallet.commission.title')}</Title>
                        <Text className="block text-lg dark:text-gray-300">
                            {t('wallet.commission.description', { rate: 20 })}
                        </Text>
                        <Text className="block text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t('wallet.commission.student')}
                        </Text>
                    </Card>
                )}

                {user?.credentials.role === 'tutor' && (
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                        <Title level={4} className="dark:text-gray-100">{t('wallet.commission.title')}</Title>
                        <Text className="block text-lg dark:text-gray-300">
                            {t('wallet.commission.description', { rate: 20 })}
                        </Text>
                        <Text className="block text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t('wallet.commission.tutor')}
                        </Text>
                    </Card>
                )}
            </div>

            {/* Transaction History */}
            <Card className="dark:bg-gray-800 dark:border-gray-700">
                <Title level={3} className="mb-6 dark:text-gray-100">{t('wallet.transactionHistory')}</Title>
                <div className="space-y-4">
                    {transactions.map((transaction) => (
                        <div key={transaction.id} 
                             className="flex items-center justify-between p-4 border-b dark:border-gray-700 last:border-0">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center mr-4 bg-gray-100 dark:bg-gray-700">
                                    {getTransactionIcon(transaction.transaction_type)}
                                </div>
                                <div>
                                    <Text strong className="block dark:text-gray-100">
                                        {getTransactionLabel(transaction.transaction_type)}
                                    </Text>
                                    <Text className="text-gray-500 dark:text-gray-400">
                                        {new Date(transaction.created_at).toLocaleString()}
                                    </Text>
                                </div>
                            </div>
                            <div>
                                <Text strong className={`block text-right ${
                                    transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 
                                    'text-red-600 dark:text-red-400'
                                }`}>
                                    {formatCurrency(transaction.amount)}
                                </Text>
                                {transaction.commission_amount > 0 && (
                                    <Text className="block text-sm text-gray-500 dark:text-gray-400 text-right">
                                        {t('wallet.commission.amount', { amount: formatCurrency(transaction.commission_amount) })}
                                    </Text>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Deposit Modal */}
            {user?.credentials.role === 'student' && (
                <Modal
                    title={t('wallet.depositModal.title')}
                    open={showDepositModal}
                    onCancel={() => setShowDepositModal(false)}
                    footer={[
                        <Button key="cancel" onClick={() => setShowDepositModal(false)}>
                            {t('common.cancel')}
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={processingPayment}
                            onClick={handleDeposit}
                        >
                            {t('wallet.deposit')}
                        </Button>
                    ]}
                >
                    <div className="space-y-4">
                        <Input
                            type="number"
                            placeholder={t('wallet.depositModal.amountPlaceholder')}
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            min={0}
                            step={100}
                            prefix="₽"
                        />
                        <Text className="block text-gray-500">
                            {t('wallet.depositModal.minAmount', { amount: formatCurrency(100) })}
                        </Text>
                    </div>
                </Modal>
            )}

            {/* Withdraw Modal */}
            <Modal
                title={t('wallet.withdrawModal.title')}
                open={showWithdrawModal}
                onCancel={() => setShowWithdrawModal(false)}
                footer={[
                    <Button key="cancel" onClick={() => setShowWithdrawModal(false)}>
                        {t('common.cancel')}
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={processingPayment}
                        onClick={handleWithdraw}
                    >
                        {t('wallet.withdraw')}
                    </Button>
                ]}
            >
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder={t('wallet.withdrawModal.amountPlaceholder')}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min={0}
                        prefix="₽"
                    />
                    <Text className="block text-gray-500">
                        {t('wallet.withdrawModal.availableBalance', { balance: formatCurrency(balance) })}
                    </Text>
                    {user?.credentials.role === 'tutor' && (
                        <Text className="block text-gray-500">
                            {t('wallet.withdrawModal.processingTime')}
                        </Text>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default Wallet; 