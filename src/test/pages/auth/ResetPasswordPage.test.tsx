import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ResetPasswordPage from '../../../pages/auth/ResetPasswordPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../services/userService', () => ({
  userService: {
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, ruta }: any) => <a href={ruta}>{texto}</a>,
}));

vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, ...props }: any) => {
    const id = props.placeholder || props.name || String(label);
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input id={id} {...props} />
      </div>
    );
  },
}));

vi.mock('../../../components/ui/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children, variant }: any) => <div role="alert" data-variant={variant}>{children}</div>,
}));

import { userService } from '../../../services/userService';
const mockUserService = vi.mocked(userService);

const renderPage = () =>
  render(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);

const emailInput = () => screen.getByPlaceholderText('tu@email.cl');
const codeInput = () => screen.getByPlaceholderText('123456');
const newPassInput = () => screen.getByPlaceholderText('Mínimo 6 caracteres');
const confirmPassInput = () => screen.getByLabelText('Confirmar contraseña');

const advanceToStep2 = async () => {
  fireEvent.change(emailInput(), { target: { value: 'user@test.cl' } });
  fireEvent.click(screen.getByText('Enviar código'));
  await waitFor(() => screen.getByText('¿No es tu correo? Cambiarlo'));
};

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders step 1 - email form', () => {
    renderPage();
    expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument();
    expect(screen.getByText('Enviar código')).toBeInTheDocument();
  });

  it('submits email and advances to step 2', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    renderPage();
    await advanceToStep2();
    expect(screen.getByText('¿No es tu correo? Cambiarlo')).toBeInTheDocument();
  });

  it('shows loading state when sending email', async () => {
    mockUserService.forgotPassword.mockReturnValue(new Promise(() => {}));
    renderPage();
    fireEvent.change(emailInput(), { target: { value: 'user@test.cl' } });
    fireEvent.click(screen.getByText('Enviar código'));
    await waitFor(() => expect(screen.getByText('Enviando...')).toBeInTheDocument());
  });

  it('shows error when forgotPassword fails with message', async () => {
    mockUserService.forgotPassword.mockRejectedValue({
      response: { data: { message: 'Correo no encontrado' } },
    });
    renderPage();
    fireEvent.change(emailInput(), { target: { value: 'bad@test.cl' } });
    fireEvent.click(screen.getByText('Enviar código'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Correo no encontrado')
    );
  });

  it('shows generic error when forgotPassword fails without message', async () => {
    mockUserService.forgotPassword.mockRejectedValue(new Error('network'));
    renderPage();
    fireEvent.change(emailInput(), { target: { value: 'bad@test.cl' } });
    fireEvent.click(screen.getByText('Enviar código'));
    await waitFor(() =>
      expect(screen.getByText('Error al enviar el código')).toBeInTheDocument()
    );
  });

  it('step 2: shows error if password is too short', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '123456' } });
    fireEvent.change(newPassInput(), { target: { value: '123' } });
    fireEvent.change(confirmPassInput(), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() =>
      expect(screen.getByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument()
    );
  });

  it('step 2: shows error if passwords do not match', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '123456' } });
    fireEvent.change(newPassInput(), { target: { value: 'password1' } });
    fireEvent.change(confirmPassInput(), { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() =>
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument()
    );
  });

  it('step 2: resets password successfully and shows success message', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    mockUserService.resetPassword.mockResolvedValue(undefined as any);
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '123456' } });
    fireEvent.change(newPassInput(), { target: { value: 'newpass123' } });
    fireEvent.change(confirmPassInput(), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() =>
      expect(screen.getByText('Contraseña actualizada. Redirigiendo...')).toBeInTheDocument()
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'), { timeout: 4000 });
  });

  it('step 2: shows loading while resetting', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    mockUserService.resetPassword.mockReturnValue(new Promise(() => {}));
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '123456' } });
    fireEvent.change(newPassInput(), { target: { value: 'pass1234' } });
    fireEvent.change(confirmPassInput(), { target: { value: 'pass1234' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() => expect(screen.getByText('Guardando...')).toBeInTheDocument());
  });

  it('step 2: shows error when reset fails with message', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    mockUserService.resetPassword.mockRejectedValue({
      response: { data: { message: 'Código inválido' } },
    });
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '999999' } });
    fireEvent.change(newPassInput(), { target: { value: 'pass123' } });
    fireEvent.change(confirmPassInput(), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Código inválido')
    );
  });

  it('step 2: shows generic error when reset fails without message', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    mockUserService.resetPassword.mockRejectedValue(new Error('network'));
    renderPage();
    await advanceToStep2();
    fireEvent.change(codeInput(), { target: { value: '123456' } });
    fireEvent.change(newPassInput(), { target: { value: 'pass123' } });
    fireEvent.change(confirmPassInput(), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Restablecer contraseña/ }));
    await waitFor(() =>
      expect(screen.getByText('Error al restablecer la contraseña')).toBeInTheDocument()
    );
  });

  it('allows going back to step 1 from step 2', async () => {
    mockUserService.forgotPassword.mockResolvedValue(undefined as any);
    renderPage();
    await advanceToStep2();
    fireEvent.click(screen.getByText('¿No es tu correo? Cambiarlo'));
    expect(screen.getByText('Enviar código')).toBeInTheDocument();
  });
});
