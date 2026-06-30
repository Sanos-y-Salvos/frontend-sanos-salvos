import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService';

vi.mock('../../services/api', () => ({
  authApi: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import { authApi } from '../../services/api';
const mockPost = vi.mocked(authApi.post);
const mockGet = vi.mocked(authApi.get);

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('login', () => {
    it('calls /api/auth/login with credentials and returns tokens', async () => {
      const tokens = { accessToken: 'acc', refreshToken: 'ref' };
      mockPost.mockResolvedValue({ data: { data: tokens } });

      const result = await authService.login('user@test.com', 'pass');

      expect(mockPost).toHaveBeenCalledWith('/api/auth/login', {
        email: 'user@test.com',
        password: 'pass',
      });
      expect(result).toEqual(tokens);
    });

    it('throws when API rejects', async () => {
      mockPost.mockRejectedValue(new Error('network error'));
      await expect(authService.login('a@b.com', 'x')).rejects.toThrow('network error');
    });
  });

  describe('logout', () => {
    it('calls /api/auth/logout with refresh token', async () => {
      mockPost.mockResolvedValue({ data: {} });
      await authService.logout('myRefreshToken');
      expect(mockPost).toHaveBeenCalledWith('/api/auth/logout', {
        refreshToken: 'myRefreshToken',
      });
    });

    it('throws when API rejects', async () => {
      mockPost.mockRejectedValue(new Error('fail'));
      await expect(authService.logout('tok')).rejects.toThrow('fail');
    });
  });

  describe('refresh', () => {
    it('calls /api/auth/refresh and returns new access token', async () => {
      mockPost.mockResolvedValue({ data: { data: { accessToken: 'newAcc' } } });
      const result = await authService.refresh('oldRefresh');
      expect(mockPost).toHaveBeenCalledWith('/api/auth/refresh', {
        refreshToken: 'oldRefresh',
      });
      expect(result).toEqual({ accessToken: 'newAcc' });
    });
  });

  describe('getMe', () => {
    it('calls /api/auth/me and returns user data', async () => {
      const userData = {
        id: 'u1', email: 'a@b.com', role: 'ciudadano',
        permissions: null, name: 'Juan', status: 'active',
        tipo: 'ciudadano' as const,
      };
      mockGet.mockResolvedValue({ data: { data: userData } });

      const result = await authService.getMe();

      expect(mockGet).toHaveBeenCalledWith('/api/auth/me');
      expect(result).toEqual(userData);
    });

    it('throws when API rejects', async () => {
      mockGet.mockRejectedValue(new Error('unauthorized'));
      await expect(authService.getMe()).rejects.toThrow('unauthorized');
    });
  });
});
