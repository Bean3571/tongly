import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    isDarkMode: false,
    toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme');
        return (savedTheme as Theme) || 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    });

    const isDarkMode = theme === 'dark';

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme, isDarkMode]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};