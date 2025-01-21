import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post('/api/auth/login', { username, password });
            localStorage.setItem('token', response.data.token);
            navigate('/dashboard');
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Login</h1>
            <div className="bg-white p-8 rounded-lg shadow-md w-96">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                >
                    Login
                </button>
                <p className="text-center mt-4">
                    Don't have an account? <a href="/register" className="text-blue-500 hover:underline">Register</a>
                </p>
            </div>
        </div>
    );
};

export default Login;