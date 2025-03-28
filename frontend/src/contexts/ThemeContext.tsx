import React, { createContext, useContext } from 'react';

interface ThemeContextType {
    theme: 'light';
    isDarkMode: false;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Apply light theme
    React.useEffect(() => {
        // Set light theme
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.classList.remove('dark');
        
        // Save light theme preference
        localStorage.setItem('theme', 'light');
    }, []);

    return (
        <ThemeContext.Provider value={{ theme: 'light', isDarkMode: false }}>
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