import React from 'react';

export const Wallet = () => {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                My Wallet 💰
            </h1>

            {/* Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-lg p-6 text-white">
                    <h2 className="text-lg font-semibold mb-2">Available Balance</h2>
                    <p className="text-3xl font-bold mb-4">$250.00</p>
                    <div className="flex space-x-2">
                        <button className="flex-1 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 
                                         transition-colors font-medium">
                            Add Funds
                        </button>
                        <button className="flex-1 px-4 py-2 border border-white text-white rounded-lg 
                                         hover:bg-blue-700 transition-colors font-medium">
                            Withdraw
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        This Month
                    </h2>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        $150.00
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">Total Spent</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Upcoming
                    </h2>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        $75.00
                    </p>
                    <p className="text-gray-600 dark:text-gray-300">Reserved for Lessons</p>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Transaction History
                </h2>
                <div className="space-y-4">
                    {[
                        { type: 'deposit', amount: 100, status: 'completed' },
                        { type: 'lesson_payment', amount: -50, status: 'completed' },
                        { type: 'withdrawal', amount: -75, status: 'pending' },
                    ].map((transaction, i) => (
                        <div key={i} className="flex items-center justify-between border-b dark:border-gray-700 
                                              last:border-0 pb-4">
                            <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4
                                               ${transaction.type === 'deposit' ? 'bg-green-100 text-green-600' :
                                                 transaction.type === 'withdrawal' ? 'bg-red-100 text-red-600' :
                                                 'bg-blue-100 text-blue-600'}`}>
                                    {transaction.type === 'deposit' ? '↓' :
                                     transaction.type === 'withdrawal' ? '↑' : '→'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {transaction.type === 'deposit' ? 'Added Funds' :
                                         transaction.type === 'withdrawal' ? 'Withdrawal' :
                                         'Lesson Payment'}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {transaction.status === 'completed' ? 'Completed' : 'Pending'} •
                                        January {20 + i}, 2024
                                    </p>
                                </div>
                            </div>
                            <span className={`font-semibold ${
                                transaction.amount > 0 ? 'text-green-600 dark:text-green-400' :
                                'text-red-600 dark:text-red-400'
                            }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}.00 USD
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wallet; 