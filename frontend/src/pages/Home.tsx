import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Welcome to Tongly</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                Learn languages with expert tutors.
            </p>
            <div className="space-x-4">
                <Link
                    to="/login"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 
                             transition duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                    Login
                </Link>
                <Link
                    to="/register"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 
                             transition duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                    Register
                </Link>
            </div>
        </div>
    );
};

export default Home;