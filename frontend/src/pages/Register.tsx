import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        try {
            await axios.post('/api/auth/register', { username, password, email, role: 'student' });
            navigate('/login');
        } catch (error) {
            console.error('Registration failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Register</h1>
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
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                />
                <button
                    onClick={handleRegister}
                    className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600"
                >
                    Register
                </button>
                <p className="text-center mt-4">
                    Already have an account? <a href="/login" className="text-blue-500 hover:underline">Login</a>
                </p>
            </div>
        </div>
    );
};

export default Register;