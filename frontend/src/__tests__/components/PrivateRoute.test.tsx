import React from 'react';
import { render, screen } from '@testing-library/react';
import { PrivateRoute } from '../../components/PrivateRoute';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const mockAuthContext = {
    isAuthenticated: true,
    user: null,
    login: jest.fn(),
    logout: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));

const TestComponent = () => <div>Protected Content</div>;

describe('PrivateRoute Component', () => {
    const setup = (isAuthenticated = true) => {
        mockAuthContext.isAuthenticated = isAuthenticated;
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={
                            <PrivateRoute>
                                <TestComponent />
                            </PrivateRoute>
                        } />
                        <Route path="/login" element={<div>Login Page</div>} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>
        );
    };

    it('renders protected content when authenticated', () => {
        setup(true);
        expect(screen.getByText(/protected content/i)).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', () => {
        setup(false);
        expect(screen.getByText(/login page/i)).toBeInTheDocument();
    });
}); 