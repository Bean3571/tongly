import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Add Link import
import api from '../services/api';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            console.log("Attempting to log in...");
            const response = await api.post('/api/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            console.log("Login successful", response.data);
            navigate('/dashboard');
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-light dark:bg-dark flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-dark shadow-lg rounded-lg p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-dark dark:text-light mb-6">Login</h1>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-dark dark:text-light"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-dark dark:text-light"
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-primary text-white p-3 rounded-lg hover:bg-primary/90 transition duration-300"
                >
                    Login
                </button>
                <p className="text-center mt-6 text-dark dark:text-light">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-secondary dark:text-accent hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;