import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Profile } from '../../pages/Profile';
import { AuthProvider } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../api/client';

jest.mock('../../api/client');

const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'student',
    first_name: 'Test',
    last_name: 'User',
    profile_picture: 'https://example.com/pic.jpg'
};

const mockAuthContext = {
    user: mockUser,
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
    useAuth: () => mockAuthContext
}));

describe('Profile Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders profile form with user data', () => {
        render(
            <BrowserRouter>
                <AuthProvider>
                    <Profile />
                </AuthProvider>
            </BrowserRouter>
        );

        expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.first_name!)).toBeInTheDocument();
        expect(screen.getByDisplayValue(mockUser.last_name!)).toBeInTheDocument();
    });

    it('handles profile update successfully', async () => {
        const mockUpdate = jest.fn().mockResolvedValue({ data: { message: 'Profile updated' } });
        (api.user.updateProfile as jest.Mock) = mockUpdate;

        render(
            <BrowserRouter>
                <AuthProvider>
                    <Profile />
                </AuthProvider>
            </BrowserRouter>
        );

        const newEmail = 'updated@example.com';
        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: newEmail }
        });

        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

        await waitFor(() => {
            expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                email: newEmail
            }));
        });
    });

    it('displays error on update failure', async () => {
        const mockUpdate = jest.fn().mockRejectedValue(new Error('Update failed'));
        (api.user.updateProfile as jest.Mock) = mockUpdate;

        render(
            <BrowserRouter>
                <AuthProvider>
                    <Profile />
                </AuthProvider>
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /update profile/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
        });
    });
}); 