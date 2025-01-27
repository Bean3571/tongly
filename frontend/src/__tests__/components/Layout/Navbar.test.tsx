import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../../../components/Layout/Navbar';
import { AuthProvider } from '../../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const mockAuthContext = {
    isAuthenticated: true,
    user: {
        username: 'testuser',
        role: 'student'
    },
    login: jest.fn(),
    logout: jest.fn()
};

jest.mock('../../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));

describe('Navbar Component', () => {
    const setup = (isAuthenticated = true) => {
        mockAuthContext.isAuthenticated = isAuthenticated;
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Navbar />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    it('renders logo and brand name', () => {
        setup();
        expect(screen.getByText(/tongly/i)).toBeInTheDocument();
    });

    it('shows login/register links when not authenticated', () => {
        setup(false);
        expect(screen.getByText(/login/i)).toBeInTheDocument();
        expect(screen.getByText(/register/i)).toBeInTheDocument();
    });

    it('shows profile and logout when authenticated', () => {
        setup(true);
        expect(screen.getByText(/profile/i)).toBeInTheDocument();
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    it('handles logout click', () => {
        setup(true);
        fireEvent.click(screen.getByText(/logout/i));
        expect(mockAuthContext.logout).toHaveBeenCalled();
    });

    it('shows username when authenticated', () => {
        setup(true);
        expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });
}); 