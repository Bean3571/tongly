import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { api } from '../../api/client';

jest.mock('../../api/client');

const TestComponent = () => {
    const { isAuthenticated, user, login, logout } = useAuth();
    return (
        <div>
            <div data-testid="auth-status">{isAuthenticated ? 'true' : 'false'}</div>
            <div data-testid="user-data">{user ? JSON.stringify(user) : 'no user'}</div>
            <button onClick={() => login('test', 'pass')}>Login</button>
            <button onClick={logout}>Logout</button>
        </div>
    );
};

describe('AuthContext', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('provides authentication state', () => {
        const { getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        expect(getByTestId('auth-status')).toHaveTextContent('false');
        expect(getByTestId('user-data')).toHaveTextContent('no user');
    });

    it('handles login successfully', async () => {
        const mockLogin = jest.fn().mockResolvedValue({
            data: {
                token: 'test-token',
                user: { id: 1, username: 'test' }
            }
        });
        (api.auth.login as jest.Mock) = mockLogin;

        const { getByText, getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        await act(async () => {
            getByText('Login').click();
        });

        expect(mockLogin).toHaveBeenCalledWith({
            username: 'test',
            password: 'pass'
        });
        expect(getByTestId('auth-status')).toHaveTextContent('true');
    });

    it('handles logout', () => {
        const { getByText, getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );

        act(() => {
            getByText('Logout').click();
        });

        expect(getByTestId('auth-status')).toHaveTextContent('false');
        expect(getByTestId('user-data')).toHaveTextContent('no user');
        expect(localStorage.getItem('token')).toBeNull();
    });
}); 