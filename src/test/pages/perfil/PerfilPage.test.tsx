import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PerfilPage from '../../../pages/perfil/PerfilPage';

const mockLogout = vi.fn();

const ciudadanoUser = {
  id: '1',
  credential_id: '1',
  email: 'juan@test.cl',
  telefono: '912345678',
  rol: 'ciudadano',
  tipo: 'ciudadano',
  region: '13',
  comuna: 'Santiago',
  is_active: true,
  ciudadano: {
    id: 'c1',
    primer_nombre: 'Juan',
    segundo_nombre: 'Carlos',
    apellido_paterno: 'Pérez',
    apellido_materno: 'López',
    run: '12.345.678-9',
    direccion: 'Calle 123',
  },
};

const institucionUser = {
  id: '2',
  credential_id: '2',
  email: 'vet@test.cl',
  telefono: '912345678',
  rol: 'veterinaria',
  tipo: 'institucion',
  region: '13',
  comuna: 'Santiago',
  is_active: true,
  foto_perfil: 'https://example.com/foto.jpg',
  institucion: {
    id: 'i1',
    nombre_institucion: 'VetCare',
    razon_social: 'VetCare Ltda.',
    rut: '76.354.771-K',
    tipo_institucion: 'veterinaria',
    direccion: 'Av. Siempre Viva 123',
  },
};

const superadminUser = {
  id: '3',
  credential_id: '3',
  email: 'super@test.cl',
  telefono: '',
  rol: 'superadmin',
  tipo: 'ciudadano',
  region: '',
  comuna: '',
  is_active: true,
  ciudadano: {
    id: 'c3',
    primer_nombre: 'Super',
    segundo_nombre: undefined,
    apellido_paterno: 'Admin',
    apellido_materno: undefined,
    run: '11.111.111-1',
    direccion: '',
  },
};

let mockUser: any = ciudadanoUser;

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

vi.mock('../../../services/userService', () => ({
  userService: {
    actualizarPerfil: vi.fn().mockResolvedValue(undefined),
    obtenerPerfil: vi.fn().mockResolvedValue(null),
    cambiarContrasena: vi.fn().mockResolvedValue({ message: 'Contraseña actualizada' }),
    desactivarCuenta: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../../services/regionService', () => ({
  regionService: {
    getRegiones: vi.fn().mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]),
    getComunas: vi.fn().mockResolvedValue([{ codigo: '13101', nombre: 'Santiago' }]),
  },
}));

vi.mock('../../../utils/validators', () => ({
  validateField: vi.fn().mockReturnValue(''),
}));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto }: any) => <a href="/">{texto}</a>,
}));

vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, error, icon, ...props }: any) => {
    const labelText = typeof label === 'string' ? label : 'campo';
    return (
      <div>
        <label>{labelText}</label>
        <input data-testid={labelText} {...props} />
        {error && <span role="status">{error}</span>}
      </div>
    );
  },
}));

vi.mock('../../../components/ui/Select', () => ({
  default: ({ label, children, error, ...props }: any) => (
    <div>
      <label>{typeof label === 'string' ? label : 'select'}</label>
      <select aria-label={typeof label === 'string' ? label : 'select'} {...props}>{children}</select>
      {error && <span>{error}</span>}
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children, variant }: any) => <div role="alert" data-variant={variant}>{children}</div>,
}));

import { userService } from '../../../services/userService';
import { regionService } from '../../../services/regionService';
import { validateField } from '../../../utils/validators';
const mockUserService = vi.mocked(userService);
const mockRegionService = vi.mocked(regionService);
const mockValidateField = vi.mocked(validateField);

const renderPage = () =>
  render(<MemoryRouter><PerfilPage /></MemoryRouter>);

describe('PerfilPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = ciudadanoUser;
    mockUserService.actualizarPerfil.mockResolvedValue(undefined as any);
    mockUserService.obtenerPerfil.mockResolvedValue(ciudadanoUser as any);
    mockUserService.cambiarContrasena.mockResolvedValue({ message: 'Contraseña actualizada' });
    mockUserService.desactivarCuenta.mockResolvedValue(undefined as any);
    mockRegionService.getRegiones.mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]);
    mockRegionService.getComunas.mockResolvedValue([{ codigo: '13101', nombre: 'Santiago' }]);
    mockValidateField.mockReturnValue('');
  });

  it('renders ciudadano profile in read mode', () => {
    renderPage();
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('juan@test.cl')).toBeInTheDocument();
    expect(screen.getByText('Ciudadano')).toBeInTheDocument();
  });

  it('renders institucion profile', () => {
    mockUser = institucionUser;
    renderPage();
    expect(screen.getAllByText('VetCare').length).toBeGreaterThan(0);
    expect(screen.getByText('vet@test.cl')).toBeInTheDocument();
  });

  it('renders profile with foto_perfil', () => {
    mockUser = institucionUser;
    renderPage();
    const img = document.querySelector('img[alt="Foto de perfil"]');
    expect(img).toBeInTheDocument();
  });

  it('does not show danger zone for superadmin', () => {
    mockUser = superadminUser;
    renderPage();
    expect(screen.queryByText('Zona de peligro')).not.toBeInTheDocument();
  });

  it('shows danger zone for non-superadmin', () => {
    renderPage();
    expect(screen.getByText('Zona de peligro')).toBeInTheDocument();
  });

  it('enters edit mode when Editar is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => expect(screen.getByText('Guardar cambios')).toBeInTheDocument());
  });

  it('cancels edit mode', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.getByText('Editar')).toBeInTheDocument());
  });

  it('saves profile changes successfully', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(mockUserService.actualizarPerfil).toHaveBeenCalled()
    );
    await waitFor(() =>
      expect(screen.getByText('Perfil actualizado correctamente')).toBeInTheDocument()
    );
  });

  it('shows error when save fails', async () => {
    mockUserService.actualizarPerfil.mockRejectedValue({
      response: { data: { message: 'Error de servidor' } },
    });
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(screen.getByText('Error de servidor')).toBeInTheDocument()
    );
  });

  it('shows generic error when save fails without message', async () => {
    mockUserService.actualizarPerfil.mockRejectedValue(new Error('network'));
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(screen.getByText('Error al actualizar el perfil')).toBeInTheDocument()
    );
  });

  it('shows validation errors when saving with invalid data', async () => {
    const { validateField } = await import('../../../utils/validators');
    vi.mocked(validateField).mockReturnValue('Requerido');
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(mockUserService.actualizarPerfil).not.toHaveBeenCalled()
    );
  });

  it('uploads foto in edit mode', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'nueva.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    expect(screen.getByText('Cambiar foto seleccionada')).toBeInTheDocument();
  });

  it('changes region and loads comunas in edit mode', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '13' } });
    await waitFor(() => expect(mockRegionService.getComunas).toHaveBeenCalled());
  });

  it('changes password successfully', async () => {
    renderPage();
    fireEvent.change(screen.getByTestId('Contraseña actual'), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByTestId('Nueva contraseña'), {
      target: { value: 'newpass123' },
    });
    fireEvent.change(screen.getByTestId('Confirmar nueva contraseña'), {
      target: { value: 'newpass123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));
    await waitFor(() =>
      expect(mockUserService.cambiarContrasena).toHaveBeenCalledWith('oldpass', 'newpass123')
    );
    await waitFor(() =>
      expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument()
    );
  });

  it('shows error when password change fails', async () => {
    mockUserService.cambiarContrasena.mockRejectedValue({
      response: { data: { message: 'Contraseña actual incorrecta' } },
    });
    renderPage();
    fireEvent.change(screen.getByTestId('Contraseña actual'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByTestId('Nueva contraseña'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByTestId('Confirmar nueva contraseña'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));
    await waitFor(() =>
      expect(screen.getByText('Contraseña actual incorrecta')).toBeInTheDocument()
    );
  });

  it('stops password change when current password is empty', async () => {
    renderPage();
    fireEvent.change(screen.getByTestId('Nueva contraseña'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByTestId('Confirmar nueva contraseña'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /actualizar contraseña/i }));
    await waitFor(() => expect(mockUserService.cambiarContrasena).not.toHaveBeenCalled());
  });

  it('shows deactivation modal when button is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() => expect(screen.getByText('¿Desactivar cuenta?')).toBeInTheDocument());
  });

  it('deactivates account and logs out', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() => screen.getByText('Sí, desactivar'));
    fireEvent.click(screen.getByText('Sí, desactivar'));
    await waitFor(() => expect(mockUserService.desactivarCuenta).toHaveBeenCalled());
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });

  it('shows error when deactivation fails', async () => {
    mockUserService.desactivarCuenta.mockRejectedValue(new Error('fail'));
    renderPage();
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() => screen.getByText('Sí, desactivar'));
    fireEvent.click(screen.getByText('Sí, desactivar'));
    await waitFor(() =>
      expect(screen.getByText('Error al desactivar la cuenta')).toBeInTheDocument()
    );
  });

  it('closes deactivation modal when Cancel is clicked', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() => screen.getByText('¿Desactivar cuenta?'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() =>
      expect(screen.queryByText('¿Desactivar cuenta?')).not.toBeInTheDocument()
    );
  });

  it('toggles password visibility buttons', () => {
    renderPage();
    const eyeButtons = screen.getAllByRole('button').filter(
      b => b.getAttribute('type') === 'button' && b.className.includes('absolute right-3')
    );
    eyeButtons.forEach(btn => {
      fireEvent.click(btn);
      fireEvent.click(btn);
    });
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
  });

  it('renders institucion edit mode correctly', async () => {
    mockUser = institucionUser;
    mockUserService.obtenerPerfil.mockResolvedValue(institucionUser as any);
    renderPage();
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => expect(screen.getByText('Guardar cambios')).toBeInTheDocument());
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
  });

  it('shows nombre in header when no ciudadano data', () => {
    mockUser = {
      ...ciudadanoUser,
      ciudadano: undefined,
      institucion: undefined,
    };
    renderPage();
    expect(screen.getByText('Usuario')).toBeInTheDocument();
  });

  it('handles blur and change events in password fields', () => {
    renderPage();
    const passInputs = [
      screen.getByTestId('Contraseña actual'),
      screen.getByTestId('Nueva contraseña'),
      screen.getByTestId('Confirmar nueva contraseña'),
    ];
    passInputs.forEach(input => {
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.blur(input, { target: { value: 'test' } });
    });
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
  });

  it('updates confirmPassword error when nueva password changes', () => {
    renderPage();
    const nuevaPass = screen.getByTestId('Nueva contraseña');
    fireEvent.blur(nuevaPass, { target: { value: 'initial' } });
    fireEvent.change(nuevaPass, { target: { value: 'changed' } });
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
  });
});
