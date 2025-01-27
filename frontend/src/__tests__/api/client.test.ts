import { api, apiClient } from '../../api/client';
import axios from 'axios';

jest.mock('axios');

describe('API Client', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('adds auth token to requests when available', async () => {
        const token = 'test-token';
        localStorage.setItem('token', token);

        await apiClient.get('/test');

        expect(axios.get).toHaveBeenCalledWith(
            '/test',
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Bearer ${token}`
                })
            })
        );
    });

    describe('auth API', () => {
        it('handles login request', async () => {
            const mockResponse = { data: { token: 'test-token' } };
            (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

            const credentials = { username: 'test', password: 'pass' };
            const response = await api.auth.login(credentials);

            expect(response.data.token).toBe('test-token');
            expect(localStorage.getItem('token')).toBe('test-token');
        });

        it('handles register request', async () => {
            const mockResponse = { data: { token: 'test-token' } };
            (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

            const userData = {
                username: 'test',
                password: 'pass',
                email: 'test@example.com',
                role: 'student'
            };
            await api.auth.register(userData);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/auth/register'),
                userData
            );
        });
    });

    describe('user API', () => {
        it('handles get profile request', async () => {
            const mockUser = { id: 1, username: 'test' };
            (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockUser });

            const response = await api.user.getProfile();

            expect(response.data).toEqual(mockUser);
        });

        it('handles update profile request', async () => {
            const updateData = { email: 'new@example.com' };
            await api.user.updateProfile(updateData);

            expect(axios.put).toHaveBeenCalledWith(
                expect.stringContaining('/profile'),
                updateData
            );
        });
    });
}); 