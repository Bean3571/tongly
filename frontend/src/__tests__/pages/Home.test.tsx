import React from 'react';
import { render, screen } from '@testing-library/react';
import { Home } from '../../pages/Home';
import { AuthProvider } from '../../contexts/AuthContext';
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

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));

describe('Home Component', () => {
    const setup = (isAuthenticated = true) => {
        mockAuthContext.isAuthenticated = isAuthenticated;
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Home />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    it('renders welcome message for authenticated users', () => {
        setup(true);
        expect(screen.getByText(/welcome.*testuser/i)).toBeInTheDocument();
    });

    it('renders guest welcome message for unauthenticated users', () => {
        setup(false);
        expect(screen.getByText(/welcome to tongly/i)).toBeInTheDocument();
        expect(screen.getByText(/get started/i)).toBeInTheDocument();
    });

    it('shows different content based on user role', () => {
        mockAuthContext.user.role = 'tutor';
        setup(true);
        expect(screen.getByText(/tutor dashboard/i)).toBeInTheDocument();

        mockAuthContext.user.role = 'student';
        setup(true);
        expect(screen.getByText(/student dashboard/i)).toBeInTheDocument();
    });
}); 