import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContext } from 'react';
import { AdminModeProvider, useAdminMode } from '../../context/AdminModeContext';
import { AuthContext } from '../../context/AuthContext';

const makeAuthCtx = (rol: string | undefined) => ({
  user: rol ? { id: 'u1', rol } as any : null,
  loading: false,
  isAuthenticated: !!rol,
  login: vi.fn(),
  logout: vi.fn(),
});

const Consumer = () => {
  const { isAdminMode, isEmployee, setAdminMode } = useAdminMode();
  return (
    <div>
      <span data-testid="admin">{String(isAdminMode)}</span>
      <span data-testid="employee">{String(isEmployee)}</span>
      <button onClick={() => setAdminMode(false)}>user-mode</button>
      <button onClick={() => setAdminMode(true)}>admin-mode</button>
    </div>
  );
};

const renderWithAuth = (rol?: string) =>
  render(
    <AuthContext.Provider value={makeAuthCtx(rol)}>
      <AdminModeProvider>
        <Consumer />
      </AdminModeProvider>
    </AuthContext.Provider>
  );

describe('AdminModeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('non-employee user: isEmployee=false, isAdminMode=false', () => {
    renderWithAuth('ciudadano');
    expect(screen.getByTestId('employee').textContent).toBe('false');
    expect(screen.getByTestId('admin').textContent).toBe('false');
  });

  it('null user: isEmployee=false', () => {
    renderWithAuth(undefined);
    expect(screen.getByTestId('employee').textContent).toBe('false');
  });

  it('administrador rol: isEmployee=true, isAdminMode=true by default', () => {
    renderWithAuth('administrador');
    expect(screen.getByTestId('employee').textContent).toBe('true');
    expect(screen.getByTestId('admin').textContent).toBe('true');
  });

  it('moderador rol: isEmployee=true', () => {
    renderWithAuth('moderador');
    expect(screen.getByTestId('employee').textContent).toBe('true');
  });

  it('superadmin rol: isEmployee=true', () => {
    renderWithAuth('superadmin');
    expect(screen.getByTestId('employee').textContent).toBe('true');
  });

  it('setAdminMode(false) sets user mode and updates localStorage', () => {
    renderWithAuth('administrador');
    fireEvent.click(screen.getByText('user-mode'));
    expect(screen.getByTestId('admin').textContent).toBe('false');
    expect(localStorage.getItem('sanos_admin_mode')).toBe('user');
  });

  it('setAdminMode(true) sets admin mode and updates localStorage', () => {
    renderWithAuth('administrador');
    fireEvent.click(screen.getByText('user-mode'));
    fireEvent.click(screen.getByText('admin-mode'));
    expect(screen.getByTestId('admin').textContent).toBe('true');
    expect(localStorage.getItem('sanos_admin_mode')).toBe('admin');
  });

  it('reads initial userModeActive from localStorage', () => {
    localStorage.setItem('sanos_admin_mode', 'user');
    renderWithAuth('administrador');
    expect(screen.getByTestId('admin').textContent).toBe('false');
  });

  it('useAdminMode returns default values outside provider', () => {
    const Hook = () => {
      const ctx = useAdminMode();
      return <span data-testid="val">{String(ctx.isAdminMode)}</span>;
    };
    render(<Hook />);
    expect(screen.getByTestId('val').textContent).toBe('false');
  });
});
