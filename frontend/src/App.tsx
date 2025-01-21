import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TutorManagement from './pages/TutorManagement';
import Leaderboard from './pages/Leaderboard';

const App = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tutors" element={<TutorManagement />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
            </Routes>
        </Router>
    );
};

export default App;