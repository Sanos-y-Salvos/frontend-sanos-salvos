import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../../utils/storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getAccessToken returns null when not set', () => {
    expect(storage.getAccessToken()).toBeNull();
  });

  it('getRefreshToken returns null when not set', () => {
    expect(storage.getRefreshToken()).toBeNull();
  });

  it('setTokens stores both tokens', () => {
    storage.setTokens('acc123', 'ref456');
    expect(localStorage.getItem('accessToken')).toBe('acc123');
    expect(localStorage.getItem('refreshToken')).toBe('ref456');
  });

  it('getAccessToken returns stored token', () => {
    storage.setTokens('myAccess', 'myRefresh');
    expect(storage.getAccessToken()).toBe('myAccess');
  });

  it('getRefreshToken returns stored token', () => {
    storage.setTokens('myAccess', 'myRefresh');
    expect(storage.getRefreshToken()).toBe('myRefresh');
  });

  it('clearTokens removes both tokens', () => {
    storage.setTokens('acc', 'ref');
    storage.clearTokens();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });

  it('clearTokens does nothing if tokens were not set', () => {
    expect(() => storage.clearTokens()).not.toThrow();
    expect(storage.getAccessToken()).toBeNull();
    expect(storage.getRefreshToken()).toBeNull();
  });
});
