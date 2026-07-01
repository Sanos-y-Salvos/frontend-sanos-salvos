import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';

vi.mock('../../utils/storage', () => ({
  storage: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

vi.mock('../../services/userService', () => ({
  userService: {
    obtenerPerfil: vi.fn(),
  },
}));

import { storage } from '../../utils/storage';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';

const mockStorage = vi.mocked(storage);
const mockAuthService = vi.mocked(authService);
const mockUserService = vi.mocked(userService);

const mockUser = {
  id: 'u1', credential_id: 'u1', email: 'a@b.com',
  telefono: '', rol: 'ciudadano', tipo: 'ciudadano' as const,
  region: '', comuna: '', is_active: true,
  ciudadano: {
    id: 'c1', primer_nombre: 'Juan', apellido_paterno: 'Pérez',
    run: '11111111-1', direccion: '',
  },
};

const TestConsumer = () => {
  const ctx = useContext(AuthContext);
  return (
    <div>
      <span data-testid="user">{ctx.user?.email ?? 'no-user'}</span>
      <span data-testid="loading">{String(ctx.loading)}</span>
      <span data-testid="auth">{String(ctx.isAuthenticated)}</span>
      <button onClick={() => ctx.login('a@b.com', 'pass')}>login</button>
      <button onClick={() => ctx.logout()}>logout</button>
    </div>
  );
};

const renderProvider = () =>
  render(<AuthProvider><TestConsumer /></AuthProvider>);

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getAccessToken.mockReturnValue(null);
    mockStorage.getRefreshToken.mockReturnValue(null);
  });

  it('starts loading and finishes with no user when no token', async () => {
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    expect(screen.getByTestId('auth').textContent).toBe('false');
  });

  it('loads user from userService when token exists', async () => {
    mockStorage.getAccessToken.mockReturnValue('validtoken');
    mockUserService.obtenerPerfil.mockResolvedValue(mockUser as any);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com')
    );
    expect(screen.getByTestId('auth').textContent).toBe('true');
  });

  it('clears tokens on 401 from userService', async () => {
    mockStorage.getAccessToken.mockReturnValue('expiredtoken');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 401 } });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    expect(mockStorage.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });

  it('falls back to authService.getMe when userService fails with non-401', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'u1', email: 'a@b.com', role: 'ciudadano',
      permissions: null, name: 'Juan Pérez', status: 'active',
      tipo: 'ciudadano' as const,
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com')
    );
  });

  it('clears tokens when both userService and authService fail', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockRejectedValue(new Error('fail'));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it('login sets user after success', async () => {
    mockStorage.getAccessToken.mockReturnValue(null);
    mockAuthService.login.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' });
    mockUserService.obtenerPerfil.mockResolvedValue(mockUser as any);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com')
    );
    expect(mockStorage.setTokens).toHaveBeenCalledWith('acc', 'ref');
  });

  it('login falls back to authService.getMe when userService fails', async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' });
    mockUserService.obtenerPerfil.mockRejectedValue(new Error('ms-users down'));
    mockAuthService.getMe.mockResolvedValue({
      id: 'u1', email: 'a@b.com', role: 'ciudadano',
      permissions: null, name: 'Juan Pérez', status: 'active',
      tipo: 'ciudadano' as const,
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com')
    );
  });

  it('logout calls authService.logout and clears user', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockStorage.getRefreshToken.mockReturnValue('ref');
    mockUserService.obtenerPerfil.mockResolvedValue(mockUser as any);
    mockAuthService.logout.mockResolvedValue(undefined);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('a@b.com')
    );
    await act(async () => {
      screen.getByText('logout').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('no-user')
    );
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it('logout works even without refresh token', async () => {
    mockStorage.getAccessToken.mockReturnValue(null);
    mockStorage.getRefreshToken.mockReturnValue(null);
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    await act(async () => {
      screen.getByText('logout').click();
    });
    expect(mockAuthService.logout).not.toHaveBeenCalled();
    expect(mockStorage.clearTokens).toHaveBeenCalled();
  });

  it('login clears tokens and throws when both userService and authService fail', async () => {
    mockAuthService.login.mockResolvedValue({ accessToken: 'acc', refreshToken: 'ref' });
    mockUserService.obtenerPerfil.mockRejectedValue(new Error('ms-users down'));
    mockAuthService.getMe.mockRejectedValue(new Error('redis down'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('false')
    );
    // Fire the click — login() rejects; onClick doesn't await, so we just flush with act
    await act(async () => {
      screen.getByText('login').click();
    });
    await waitFor(() => expect(mockStorage.clearTokens).toHaveBeenCalled());
    expect(screen.getByTestId('user').textContent).toBe('no-user');
    consoleError.mockRestore();
  });

  it('builds institucion user from getMe fallback', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'i1', email: 'vet@b.com', role: 'institucion',
      permissions: null, name: 'Clínica Vet', status: 'active',
      tipo: 'institucion' as const,
      razon_social: 'Clínica Vet SA', rut: '76.354.771-K',
      tipo_institucion: 'veterinaria',
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('vet@b.com')
    );
  });

  it('builds ciudadano user with primer_nombre/apellido_paterno directly in getMe data', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'u2', email: 'c2@b.com', role: 'ciudadano',
      permissions: null, name: 'Pedro Soto', status: 'active',
      tipo: 'ciudadano' as const,
      primer_nombre: 'Pedro',
      apellido_paterno: 'Soto',
      run: '22.222.222-2',
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('c2@b.com')
    );
  });

  it('builds ciudadano user from name with no surname (covers partes.slice(1) || "")', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'u3', email: 'mono@b.com', role: 'ciudadano',
      permissions: null, name: 'Mononym', status: 'active',
      tipo: 'ciudadano' as const,
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('mono@b.com')
    );
  });

  it('builds ciudadano user with no name (covers cached.name || "" right branch on line 24)', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'u5', email: 'noname@b.com', role: 'ciudadano',
      permissions: null, status: 'active',
      tipo: 'ciudadano' as const,
      // no name, no primer_nombre — partes will be [''] and primer_nombre will be ''
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('noname@b.com')
    );
  });

  it('builds institucion user with no name/razon_social (covers || "" and ?? "" fallbacks)', async () => {
    mockStorage.getAccessToken.mockReturnValue('token');
    mockUserService.obtenerPerfil.mockRejectedValue({ response: { status: 500 } });
    mockAuthService.getMe.mockResolvedValue({
      id: 'i2', email: 'empty-inst@b.com', role: 'institucion',
      permissions: null, status: 'active',
      tipo: 'institucion' as const,
    });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('empty-inst@b.com')
    );
  });
});
