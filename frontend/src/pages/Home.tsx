import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-light dark:bg-dark flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold text-dark dark:text-light mb-4">Welcome to Tongly</h1>
            <p className="text-secondary dark:text-accent mb-8 text-lg">
                Learn languages with expert tutors.
            </p>
            <div className="space-x-4">
                <Link
                    to="/login"
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition duration-300"
                >
                    Login
                </Link>
                <Link
                    to="/register"
                    className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition duration-300"
                >
                    Register
                </Link>
            </div>
        </div>
    );
};

export default Home;