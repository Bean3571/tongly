import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-primary text-white hover:bg-primary/90 transition duration-300"
        >
            {isDarkMode ? '🌞' : '🌙'}
        </button>
    );
};

export default ThemeToggle;