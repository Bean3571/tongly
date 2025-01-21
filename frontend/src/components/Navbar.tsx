import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="bg-blue-600 p-4 text-white">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Tongly</Link>
                <div className="space-x-4">
                    <Link to="/dashboard" className="hover:underline">Dashboard</Link>
                    <Link to="/tutors" className="hover:underline">Tutors</Link>
                    <Link to="/leaderboard" className="hover:underline">Leaderboard</Link>
                    <Link to="/login" className="hover:underline">Login</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;