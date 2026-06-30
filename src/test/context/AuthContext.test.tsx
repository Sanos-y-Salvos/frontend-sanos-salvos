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
});
