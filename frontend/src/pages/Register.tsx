import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Add Link import
import api from '../services/api';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            console.log("Attempting to register...");
            await api.post('/api/auth/register', { username, password, email, role: 'student' });
            console.log("Registration successful");
            navigate('/login');
        } catch (error) {
            console.error("Registration failed", error);
        }
    };

    return (
        <div className="min-h-screen bg-light dark:bg-dark flex flex-col items-center justify-center p-4">
            <div className="bg-white dark:bg-dark shadow-lg rounded-lg p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold text-dark dark:text-light mb-6">Register</h1>
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
                    className="w-full p-3 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-dark dark:text-light"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-dark dark:text-light"
                />
                <button
                    onClick={handleRegister}
                    className="w-full bg-secondary text-white p-3 rounded-lg hover:bg-secondary/90 transition duration-300"
                >
                    Register
                </button>
                <p className="text-center mt-6 text-dark dark:text-light">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary dark:text-accent hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;