import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Register } from '../../pages/Register';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../api/client';

jest.mock('../../api/client');

describe('Register Component', () => {
    const setup = () => {
        return render(
            <BrowserRouter>
                <AuthProvider>
                    <Register />
                </AuthProvider>
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders registration form', () => {
        setup();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('handles successful registration', async () => {
        const mockRegister = jest.fn().mockResolvedValue({ data: { token: 'test-token' } });
        (api.auth.register as jest.Mock) = mockRegister;

        setup();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'student' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
                role: 'student'
            });
        });
    });

    it('displays validation errors', async () => {
        setup();
        
        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getAllByText(/required/i)).toHaveLength(3);
        });
    });

    it('handles registration error', async () => {
        const mockRegister = jest.fn().mockRejectedValue(new Error('Registration failed'));
        (api.auth.register as jest.Mock) = mockRegister;

        setup();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/role/i), { target: { value: 'student' } });

        fireEvent.click(screen.getByRole('button', { name: /register/i }));

        await waitFor(() => {
            expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
        });
    });
}); 