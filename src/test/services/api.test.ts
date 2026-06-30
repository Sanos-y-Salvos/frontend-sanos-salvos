import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock storage before importing api
vi.mock('../../utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

import { storage } from '../../utils/storage';
import { authApi, usersApi, soporteApi, localizacionApi, reportesApi } from '../../services/api';

const mockStorage = vi.mocked(storage);

describe('api instances', () => {
  it('authApi is defined', () => expect(authApi).toBeDefined());
  it('usersApi is defined', () => expect(usersApi).toBeDefined());
  it('soporteApi is defined', () => expect(soporteApi).toBeDefined());
  it('localizacionApi is defined', () => expect(localizacionApi).toBeDefined());
  it('reportesApi is defined', () => expect(reportesApi).toBeDefined());
});

describe('request interceptor adds Authorization header', () => {
  beforeEach(() => vi.clearAllMocks());

  it('attaches Bearer token when access token exists', async () => {
    mockStorage.getAccessToken.mockReturnValue('mytoken');
    const config = { headers: {} as any };
    const interceptor = (authApi.interceptors.request as any).handlers[0];
    const result = interceptor.fulfilled(config);
    expect(result.headers.Authorization).toBe('Bearer mytoken');
  });

  it('does not add Authorization when no token', async () => {
    mockStorage.getAccessToken.mockReturnValue(null);
    const config = { headers: {} as any };
    const interceptor = (authApi.interceptors.request as any).handlers[0];
    const result = interceptor.fulfilled(config);
    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe('response interceptor handles 401', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('rejects non-401 errors without retry', async () => {
    const error = { response: { status: 500 }, config: {} };
    const interceptor = (authApi.interceptors.response as any).handlers[0];
    await expect(interceptor.rejected(error)).rejects.toEqual(error);
  });

  it('rejects 401 when no refresh token and clears tokens', async () => {
    mockStorage.getRefreshToken.mockReturnValue(null);
    const error = { response: { status: 401 }, config: { _retry: false } };
    const interceptor = (authApi.interceptors.response as any).handlers[0];
    await expect(interceptor.rejected(error)).rejects.toBeDefined();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it('does not retry if _retry is already true', async () => {
    const error = { response: { status: 401 }, config: { _retry: true } };
    const interceptor = (authApi.interceptors.response as any).handlers[0];
    await expect(interceptor.rejected(error)).rejects.toEqual(error);
  });
});

describe('response interceptor — fulfilled passthrough', () => {
  it('passes through successful responses unchanged', () => {
    const interceptor = (authApi.interceptors.response as any).handlers[0];
    const res = { data: { id: 1 }, status: 200, headers: {} };
    expect(interceptor.fulfilled(res)).toBe(res);
  });
});

describe('response interceptor — refresh token flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refreshes token and retries request on 401', async () => {
    const newToken = 'newAccessToken';
    mockStorage.getRefreshToken.mockReturnValue('refreshTok');
    mockStorage.getAccessToken.mockReturnValue('oldToken');

    const axiosMock = await import('axios');
    vi.spyOn(axiosMock.default, 'post').mockResolvedValueOnce({
      data: { accessToken: newToken, refreshToken: 'newRefresh' },
    });

    const interceptor = (authApi.interceptors.response as any).handlers[0];
    const originalConfig = { _retry: false, headers: {} as any };
    const error = { response: { status: 401 }, config: originalConfig };

    // The retry call (instance(original)) will fail with network error in jsdom, so wrap it.
    // What matters is that setTokens was called with the new tokens before the retry.
    try {
      await interceptor.rejected(error);
    } catch {
      // network error from the retry is expected in jsdom — ignore it
    }
    expect(mockStorage.setTokens).toHaveBeenCalledWith(newToken, 'newRefresh');
  });

  it('queues second 401 while refresh is in progress', async () => {
    let resolveRefresh!: (v: any) => void;
    mockStorage.getRefreshToken.mockReturnValue('refreshTok');

    const axiosMock = await import('axios');
    vi.spyOn(axiosMock.default, 'post').mockReturnValueOnce(
      new Promise(r => { resolveRefresh = r; }) as any,
    );

    // Replace the adapter on authApi so retry requests reject synchronously
    // and never escape as unhandled rejections after the test completes.
    const savedAdapter = authApi.defaults.adapter;
    authApi.defaults.adapter = () => Promise.reject({ isAxiosError: true, message: 'mocked network', response: null, config: {} });

    const interceptor = (authApi.interceptors.response as any).handlers[0];
    const cfg1 = { _retry: false, headers: {} as any };
    const cfg2 = { _retry: false, headers: {} as any };

    // First 401 starts the refresh (sets isRefreshing = true)
    const p1 = interceptor.rejected({ response: { status: 401 }, config: cfg1 });
    // Second 401 should be queued (lines 53-56)
    const p2 = interceptor.rejected({ response: { status: 401 }, config: cfg2 });

    // Resolve the refresh token response
    resolveRefresh({ data: { accessToken: 'newTok', refreshToken: 'newRefresh' } });

    try { await p1; } catch { /* retry is expected to fail */ }
    try { await p2; } catch { /* retry is expected to fail */ }

    authApi.defaults.adapter = savedAdapter;
    expect(mockStorage.setTokens).toHaveBeenCalledWith('newTok', 'newRefresh');
  });

  it('uses existing refreshToken when data.refreshToken is absent (line 65 ?? branch)', async () => {
    const newToken = 'newAccessToken2';
    mockStorage.getRefreshToken.mockReturnValue('existingRefresh');
    const axiosMock = await import('axios');
    vi.spyOn(axiosMock.default, 'post').mockResolvedValueOnce({
      data: { accessToken: newToken },
    });
    const interceptor = (authApi.interceptors.response as any).handlers[0];
    const error = { response: { status: 401 }, config: { _retry: false, headers: {} as any } };
    try { await interceptor.rejected(error); } catch { /* retry network error expected */ }
    expect(mockStorage.setTokens).toHaveBeenCalledWith(newToken, 'existingRefresh');
  });

  it('clears tokens and redirects when refresh fails', async () => {
    mockStorage.getRefreshToken.mockReturnValue('badRefresh');

    const axiosMock = await import('axios');
    vi.spyOn(axiosMock.default, 'post').mockRejectedValueOnce(new Error('refresh failed'));

    // Mock window.location.href setter
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    const interceptor = (authApi.interceptors.response as any).handlers[0];
    const error = { response: { status: 401 }, config: { _retry: false, headers: {} } };

    await expect(interceptor.rejected(error)).rejects.toBeDefined();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });
});
