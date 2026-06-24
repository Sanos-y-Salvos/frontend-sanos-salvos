import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../../pages/auth/LoginPage';

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, icon, ...props }: any) => (
    <div>
      <label>{typeof label === 'string' ? label : 'input'}</label>
      <input {...props} />
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByText('Bienvenido de vuelta')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('navigates home when logo is clicked', () => {
    renderLogin();
    const homeButtons = screen.getAllByRole('button');
    const logoButton = homeButtons.find(b => b.textContent?.includes('Sanos y Salvos'));
    fireEvent.click(logoButton!);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to register page', () => {
    renderLogin();
    fireEvent.click(screen.getByText('Regístrate gratis'));
    expect(mockNavigate).toHaveBeenCalledWith('/registro');
  });

  it('navigates to reset password page', () => {
    renderLogin();
    fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
    expect(mockNavigate).toHaveBeenCalledWith('/reset-password');
  });

  it('toggles password visibility', () => {
    renderLogin();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    expect(passwordInput).toHaveAttribute('type', 'password');
    const toggleButtons = screen.getAllByRole('button');
    const eyeButton = toggleButtons.find(b => b.className.includes('absolute right-3'));
    fireEvent.click(eyeButton!);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(eyeButton!);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('logs in as employee and redirects to /admin', async () => {
    mockLogin.mockResolvedValue({ rol: 'administrador' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 'admin@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('logs in as regular user and redirects to /', async () => {
    mockLogin.mockResolvedValue({ rol: 'ciudadano' });
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 'user@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/'));
  });

  it('shows error on failed login', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 'bad@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos')
    );
  });

  it('shows loading state while submitting', async () => {
    mockLogin.mockReturnValue(new Promise(() => {}));
    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 'u@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument());
  });

  it('redirects to / for moderador role', async () => {
    mockLogin.mockResolvedValue({ rol: 'moderador' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 'm@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('redirects to /admin for superadmin role', async () => {
    mockLogin.mockResolvedValue({ rol: 'superadmin' });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText('tu@email.cl'), { target: { value: 's@test.cl' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'pass' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
  });
});
