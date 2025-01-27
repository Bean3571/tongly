import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../../pages/Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../api/client';

jest.mock('../../api/client');

describe('Login Component', () => {
    const setup = () => {
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Login />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', () => {
        setup();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('handles successful login', async () => {
        const mockLogin = jest.fn().mockResolvedValue({ data: { token: 'test-token' } });
        (api.auth.login as jest.Mock) = mockLogin;

        setup();

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                username: 'testuser',
                password: 'password123',
            });
        });
    });

    it('handles login error', async () => {
        const mockLogin = jest.fn().mockRejectedValue(new Error('Login failed'));
        (api.auth.login as jest.Mock) = mockLogin;

        setup();

        fireEvent.change(screen.getByLabelText(/username/i), {
            target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: 'wrongpassword' },
        });
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalled();
            expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
    });
}); 