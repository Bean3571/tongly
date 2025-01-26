import React from 'react';

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-light dark:bg-dark p-8">
            <h1 className="text-2xl font-bold text-dark dark:text-light mb-6">Dashboard</h1>
            <div className="bg-white dark:bg-dark shadow-lg rounded-lg p-6">
                <p className="text-dark dark:text-light">Welcome to your dashboard!</p>
            </div>
        </div>
    );
};

export default Dashboard;