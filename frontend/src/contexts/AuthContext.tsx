import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Fetch user profile
            api.user.getProfile()
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                    setUser(null);
                });
        }
    }, []);

    const login = async (username: string, password: string) => {
        const response = await api.auth.login({ username, password });
        localStorage.setItem('token', response.data.token);
        await refreshUser();
    };

    const register = async (username: string, email: string, password: string) => {
        await api.auth.register({ username, email, password, role: 'student' });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const response = await api.user.getProfile();
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 