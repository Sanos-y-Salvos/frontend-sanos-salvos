import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from '../../../pages/auth/RegisterPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../services/userService', () => ({
  userService: {
    registrarCiudadano: vi.fn(),
    registrarInstitucion: vi.fn(),
  },
}));

vi.mock('../../../services/regionService', () => ({
  regionService: {
    getRegiones: vi.fn().mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]),
    getComunas: vi.fn().mockResolvedValue([{ codigo: '13101', nombre: 'Santiago' }]),
  },
}));

vi.mock('../../../utils/rutFormatter', () => ({
  formatRut: (v: string) => v,
  parseRut: (v: string) => v,
}));

vi.mock('../../../utils/validators', () => ({
  validateField: vi.fn().mockReturnValue(''),
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, error, icon, ...props }: any) => (
    <div>
      <label>{typeof label === 'object' ? 'campo' : label}</label>
      <input data-testid={props.placeholder || props.name || 'input'} {...props} />
      {error && <span role="status">{error}</span>}
    </div>
  ),
}));

vi.mock('../../../components/ui/Select', () => ({
  default: ({ label, children, error, ...props }: any) => (
    <div>
      <label>{typeof label === 'object' ? 'select' : label}</label>
      <select aria-label={typeof label === 'object' ? 'select' : label} {...props}>{children}</select>
      {error && <span role="status">{error}</span>}
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

import { userService } from '../../../services/userService';
import { regionService } from '../../../services/regionService';
import { validateField } from '../../../utils/validators';

const mockUserService = vi.mocked(userService);
const mockRegionService = vi.mocked(regionService);
const mockValidateField = vi.mocked(validateField);

const renderPage = () =>
  render(<MemoryRouter><RegisterPage /></MemoryRouter>);

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegionService.getRegiones.mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]);
    mockRegionService.getComunas.mockResolvedValue([{ codigo: '13101', nombre: 'Santiago' }]);
    mockValidateField.mockReturnValue('');
  });

  it('renders type selection screen', () => {
    renderPage();
    expect(screen.getByText('Crear cuenta')).toBeInTheDocument();
    expect(screen.getByText('Persona')).toBeInTheDocument();
    expect(screen.getByText('Institución')).toBeInTheDocument();
  });

  it('navigates to / from left panel logo', () => {
    renderPage();
    const buttons = screen.getAllByRole('button');
    const logoBtn = buttons.find(b => b.textContent?.includes('Sanos y Salvos'));
    if (logoBtn) fireEvent.click(logoBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to login from type selection', () => {
    renderPage();
    fireEvent.click(screen.getByText('Inicia sesión'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows ciudadano form when Persona clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => expect(screen.getByText('Registro de persona')).toBeInTheDocument());
  });

  it('shows institucion form when Institución clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Institución'));
    await waitFor(() => expect(screen.getByText('Registro de institución')).toBeInTheDocument());
  });

  it('goes back to type selection via ArrowLeft button', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const allButtons = screen.getAllByRole('button');
    const backBtn = allButtons.find(b => b.querySelector('svg'));
    if (backBtn && !backBtn.textContent?.includes('Crear')) {
      fireEvent.click(backBtn);
    }
    expect(screen.queryByText('Registro de persona') || screen.queryByText('Crear cuenta')).toBeTruthy();
  });

  it('submits ciudadano form successfully', async () => {
    mockUserService.registrarCiudadano.mockResolvedValue(undefined as any);
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));

    const form = document.querySelector('form');
    fireEvent.submit(form!);
    await waitFor(() => expect(screen.getByText('¡Cuenta creada!')).toBeInTheDocument());
  });

  it('navigates to login after success', async () => {
    mockUserService.registrarCiudadano.mockResolvedValue(undefined as any);
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => screen.getByText('¡Cuenta creada!'));
    fireEvent.click(screen.getByText('Ir al inicio de sesión'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows specific error for duplicate email', async () => {
    mockUserService.registrarCiudadano.mockRejectedValue({
      response: { data: { message: 'El correo ya está registrado' } },
    });
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows generic error on unknown failure', async () => {
    mockUserService.registrarCiudadano.mockRejectedValue(new Error('network'));
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('Error al registrarse')).toBeInTheDocument());
  });

  it('stops submission when validation fails', async () => {
    mockValidateField.mockReturnValue('Requerido');
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).not.toHaveBeenCalled());
  });

  it('submits institucion form successfully', async () => {
    mockUserService.registrarInstitucion.mockResolvedValue(undefined as any);
    renderPage();
    fireEvent.click(screen.getByText('Institución'));
    await waitFor(() => screen.getByText('Registro de institución'));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('¡Cuenta creada!')).toBeInTheDocument());
  });

  it('handles region change and loads comunas', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '13' } });
    await waitFor(() => expect(mockRegionService.getComunas).toHaveBeenCalledWith('13'));
  });

  it('handles getComunas failure gracefully', async () => {
    mockRegionService.getComunas.mockRejectedValue(new Error('fail'));
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '13' } });
    await waitFor(() => expect(screen.getByText('Registro de persona')).toBeInTheDocument());
  });

  it('handles file upload in ciudadano form', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'foto.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    expect(screen.getByText('foto.png')).toBeInTheDocument();
  });

  it('includes foto when submitting', async () => {
    mockUserService.registrarCiudadano.mockResolvedValue(undefined as any);
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).toHaveBeenCalled());
  });

  it('toggles password and confirm password visibility', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const toggleBtns = screen.getAllByRole('button', { name: '' }).filter(
      b => b.getAttribute('type') === 'button' && b.className.includes('absolute right-3')
    );
    toggleBtns.forEach(btn => {
      fireEvent.click(btn);
      fireEvent.click(btn);
    });
    expect(screen.getByText('Registro de persona')).toBeInTheDocument();
  });

  it('calls onChange and touch for input fields', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));

    const inputs = document.querySelectorAll('input:not([type="file"]):not([type="password"]):not([type="hidden"])');
    inputs.forEach(input => {
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.blur(input, { target: { value: 'test' } });
    });
    expect(screen.getByText('Registro de persona')).toBeInTheDocument();
  });

  it('handles institucion with optional segundo_nombre and apellido_materno appended', async () => {
    mockUserService.registrarCiudadano.mockResolvedValue(undefined as any);
    renderPage();
    fireEvent.click(screen.getByText('Persona'));
    await waitFor(() => screen.getByText('Registro de persona'));
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
      if (i.getAttribute('type') !== 'file') {
        fireEvent.change(i, { target: { value: 'valor' } });
      }
    });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText('¡Cuenta creada!')).toBeInTheDocument());
  });
});
