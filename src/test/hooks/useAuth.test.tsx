import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext } from '../../context/AuthContext';
import { useAuth } from '../../hooks/useAuth';

const mockContextValue = {
  user: { id: 'u1', email: 'test@test.com' } as any,
  loading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

const Consumer = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="email">{auth.user?.email ?? 'none'}</span>
      <span data-testid="loading">{String(auth.loading)}</span>
      <span data-testid="auth">{String(auth.isAuthenticated)}</span>
    </div>
  );
};

describe('useAuth', () => {
  it('returns context value provided by AuthContext', () => {
    render(
      <AuthContext.Provider value={mockContextValue}>
        <Consumer />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('email').textContent).toBe('test@test.com');
    expect(screen.getByTestId('loading').textContent).toBe('false');
    expect(screen.getByTestId('auth').textContent).toBe('true');
  });

  it('returns empty context when no provider', () => {
    // useAuth returns {} as AuthContextType when no provider
    render(<Consumer />);
    expect(screen.getByTestId('email').textContent).toBe('none');
  });

  it('reflects updated loading state', () => {
    render(
      <AuthContext.Provider value={{ ...mockContextValue, loading: true }}>
        <Consumer />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('loading').textContent).toBe('true');
  });

  it('reflects unauthenticated state', () => {
    render(
      <AuthContext.Provider value={{ ...mockContextValue, user: null, isAuthenticated: false }}>
        <Consumer />
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('none');
  });
});
