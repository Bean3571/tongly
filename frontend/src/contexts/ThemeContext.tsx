import React, { createContext, useContext, useEffect } from 'react';

interface ThemeContextType {
    theme: 'light';
    isDarkMode: false;
    accentColor: 'orange';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Apply light theme with orange accent
    useEffect(() => {
        // Set light theme
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        
        // Set orange accent color
        document.documentElement.style.setProperty('--accent-primary', 'var(--orange-500)');
        document.documentElement.style.setProperty('--accent-primary-hover', 'var(--orange-600)');
        document.documentElement.style.setProperty('--accent-primary-pressed', 'var(--orange-700)');
        document.documentElement.style.setProperty('--accent-primary-light', 'var(--orange-100)');
        document.documentElement.style.setProperty('--accent-primary-lighter', 'var(--orange-50)');
        
        // Save light theme preference
        localStorage.setItem('theme', 'light');
        localStorage.setItem('accentColor', 'orange');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme: 'light', isDarkMode: false, accentColor: 'orange' }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};