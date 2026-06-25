import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminUsuariosPage from '../../../pages/admin/AdminUsuariosPage';

let mockAuthUser: any = { rol: 'administrador', id: 'admin1' };

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockAuthUser }),
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, onClick }: any) => <button onClick={onClick}>{texto || 'Volver'}</button>,
}));
vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));
vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, error, icon, ...props }: any) => (
    <div>
      <label>{typeof label === 'string' ? label : 'campo'}</label>
      <input aria-label={typeof label === 'string' ? label : 'campo'} {...props} />
      {error && <span>{error}</span>}
    </div>
  ),
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

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }: any) => <button onClick={onClick} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../utils/rutFormatter', () => ({
  formatRut: (v: string) => v,
  parseRut: (v: string) => v,
}));

vi.mock('../../../utils/validators', () => ({
  validateField: vi.fn().mockReturnValue(''),
}));

const ciudadanoUser = {
  id: 'u1', email: 'juan@test.cl', telefono: '912345678',
  rol: 'ciudadano', tipo: 'ciudadano', region: '13', comuna: 'Santiago',
  is_active: true, created_at: '2025-01-01T00:00:00Z',
  ciudadano: {
    id: 'c1', primer_nombre: 'Juan', segundo_nombre: 'Carlos',
    apellido_paterno: 'Pérez', apellido_materno: 'López',
    run: '12.345.678-9', direccion: 'Calle 123',
  },
};

const institucionUser = {
  id: 'u2', email: 'vet@test.cl', telefono: '912345678',
  rol: 'veterinaria', tipo: 'institucion', region: '13', comuna: 'Santiago',
  is_active: false, created_at: '2025-01-02T00:00:00Z',
  foto_perfil: 'https://example.com/foto.jpg',
  institucion: {
    id: 'i1', nombre_institucion: 'VetCare', razon_social: 'VetCare Ltda.',
    rut: '76.354.771-K', tipo_institucion: 'veterinaria', direccion: 'Av. Test 1',
  },
};

const superadminUser = {
  id: 'u3', email: 'super@test.cl', telefono: '',
  rol: 'superadmin', tipo: 'ciudadano', region: '', comuna: '',
  is_active: true,
  ciudadano: { id: 'c3', primer_nombre: 'Super', apellido_paterno: 'Admin', run: '11.111.111-1', direccion: '' },
};

vi.mock('../../../services/userService', () => ({
  userService: {
    listarUsuarios: vi.fn().mockResolvedValue([]),
    verUsuario: vi.fn(),
    cambiarEstadoUsuario: vi.fn(),
    cambiarRolUsuario: vi.fn(),
    editarDatosUsuario: vi.fn(),
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

import { userService } from '../../../services/userService';
import { regionService } from '../../../services/regionService';
import { validateField } from '../../../utils/validators';
const mockUserService = vi.mocked(userService);
const mockRegionService = vi.mocked(regionService);
const mockValidateField = vi.mocked(validateField);

const renderPage = () =>
  render(<MemoryRouter><AdminUsuariosPage /></MemoryRouter>);

describe('AdminUsuariosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateField.mockReturnValue('');
    mockAuthUser = { rol: 'administrador', id: 'admin1' };
    mockUserService.listarUsuarios.mockResolvedValue([]);
    mockUserService.verUsuario.mockResolvedValue(ciudadanoUser as any);
    mockUserService.cambiarEstadoUsuario.mockResolvedValue({ ...ciudadanoUser, is_active: false } as any);
    mockUserService.cambiarRolUsuario.mockResolvedValue({ ...ciudadanoUser, rol: 'moderador' } as any);
    mockUserService.editarDatosUsuario.mockResolvedValue(ciudadanoUser as any);
    mockUserService.registrarCiudadano.mockResolvedValue(undefined as any);
    mockUserService.registrarInstitucion.mockResolvedValue(undefined as any);
    mockRegionService.getRegiones.mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]);
    mockRegionService.getComunas.mockResolvedValue([{ codigo: '13101', nombre: 'Santiago' }]);
  });

  it('renders the users list page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument());
  });

  it('shows loading state', () => {
    mockUserService.listarUsuarios.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Cargando usuarios...')).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('No hay usuarios')).toBeInTheDocument());
  });

  it('shows users in the list', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
  });

  it('shows institution user in list', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('VetCare')).toBeInTheDocument());
  });

  it('shows error when loading fails', async () => {
    mockUserService.listarUsuarios.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar los usuarios')
    );
  });

  it('filters by rol', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Todos')[0]);
    fireEvent.click(screen.getAllByText('Ciudadano')[0]);
    await waitFor(() =>
      expect(mockUserService.listarUsuarios).toHaveBeenCalledWith({ rol: 'ciudadano' })
    );
  });

  it('filters by estado activo', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Todos')[0]);
    fireEvent.click(screen.getByText('Activos'));
    await waitFor(() =>
      expect(mockUserService.listarUsuarios).toHaveBeenCalledWith({ is_active: true })
    );
  });

  it('filters by estado inactivo', async () => {
    renderPage();
    await waitFor(() => screen.getAllByText('Todos')[0]);
    fireEvent.click(screen.getByText('Inactivos'));
    await waitFor(() =>
      expect(mockUserService.listarUsuarios).toHaveBeenCalledWith({ is_active: false })
    );
  });

  it('superadmin filter includes superadmin users', async () => {
    mockAuthUser = { rol: 'superadmin', id: 'super1' };
    mockUserService.listarUsuarios.mockResolvedValue([superadminUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Super Admin')).toBeInTheDocument());
  });

  it('non-superadmin does not see superadmin users', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([superadminUser, ciudadanoUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    expect(screen.queryByText('super@test.cl')).not.toBeInTheDocument();
  });

  it('opens create user modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => expect(screen.getByText('Crear usuario', { selector: 'h2' })).toBeInTheDocument());
  });

  it('closes create user modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() =>
      expect(screen.queryByText('Crear usuario', { selector: 'h2' })).not.toBeInTheDocument()
    );
  });

  it('switches between ciudadano and institucion tabs in modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Institución', { selector: 'button' }));
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    expect(screen.getByText('Institución', { selector: 'button' })).toBeInTheDocument();
  });

  const openCreateModal = async () => {
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));
  };

  it('creates ciudadano user', async () => {
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Usuario creado correctamente')).toBeInTheDocument());
  });

  it('shows error when creating user fails', async () => {
    mockUserService.registrarCiudadano.mockRejectedValue({
      response: { data: { message: 'Email ya en uso' } },
    });
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Email ya en uso'));
  });

  it('shows generic error when creating user fails without message', async () => {
    mockUserService.registrarCiudadano.mockRejectedValue({ message: 'network error' });
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('network error'));
  });

  it('stops form submission when validation fails', async () => {
    mockValidateField.mockReturnValue('Requerido');
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).not.toHaveBeenCalled());
  });

  it('opens user detail view', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => expect(mockUserService.verUsuario).toHaveBeenCalledWith('u1'));
    await waitFor(() => expect(screen.getByText('Volver a usuarios')).toBeInTheDocument());
  });

  it('shows error when opening user detail fails', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    mockUserService.verUsuario.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar el usuario')
    );
  });

  it('back button in detail returns to list', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a usuarios'));
    fireEvent.click(screen.getByText('Volver a usuarios'));
    await waitFor(() => expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument());
  });

  it('changes user status', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Desactivar cuenta'));
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() =>
      expect(mockUserService.cambiarEstadoUsuario).toHaveBeenCalledWith('u1', false)
    );
    await waitFor(() =>
      expect(screen.getByText('Cuenta desactivada correctamente')).toBeInTheDocument()
    );
  });

  it('shows error when changing status fails', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    mockUserService.cambiarEstadoUsuario.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Desactivar cuenta'));
    fireEvent.click(screen.getByText('Desactivar cuenta'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cambiar el estado')
    );
  });

  it('changes user role', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Cambiar rol'));

    const rolSelect = screen.getByRole('combobox');
    fireEvent.change(rolSelect, { target: { value: 'moderador' } });
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() =>
      expect(mockUserService.cambiarRolUsuario).toHaveBeenCalledWith('u1', 'moderador')
    );
    await waitFor(() =>
      expect(screen.getByText('Rol actualizado correctamente')).toBeInTheDocument()
    );
  });

  it('does not call cambiarRol if rol is the same', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Cambiar rol'));
    fireEvent.click(screen.getByText('Guardar'));
    expect(mockUserService.cambiarRolUsuario).not.toHaveBeenCalled();
  });

  it('shows error when changing role fails', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    mockUserService.cambiarRolUsuario.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Cambiar rol'));
    const rolSelect = screen.getByRole('combobox');
    fireEvent.change(rolSelect, { target: { value: 'moderador' } });
    fireEvent.click(screen.getByText('Guardar'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cambiar el rol')
    );
  });

  it('enters edit mode in detail view', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => expect(screen.getByText('Guardar cambios')).toBeInTheDocument());
  });

  it('saves edit and returns to read mode', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(mockUserService.editarDatosUsuario).toHaveBeenCalledWith('u1', expect.any(Object))
    );
    await waitFor(() =>
      expect(screen.getByText('Datos actualizados correctamente')).toBeInTheDocument()
    );
  });

  it('shows error when saving edit fails', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    mockUserService.editarDatosUsuario.mockRejectedValue({
      response: { data: { message: 'Error al guardar' } },
    });
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al guardar')
    );
  });

  it('cancels edit mode', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Cancelar'));
    fireEvent.click(screen.getByText('Cancelar'));
    await waitFor(() => expect(screen.getByText('Editar')).toBeInTheDocument());
  });

  it('opens detail for institution user', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    mockUserService.verUsuario.mockResolvedValue(institucionUser as any);
    renderPage();
    await waitFor(() => screen.getByText('VetCare'));
    fireEvent.click(screen.getAllByText('VetCare')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Volver a usuarios')).toBeInTheDocument());
  });

  it('creates institution user', async () => {
    renderPage();
    await openCreateModal();
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarInstitucion).toHaveBeenCalled());
  });

  it('loads comunas when region is selected in create modal', async () => {
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    const regionSelects = screen.getAllByRole('combobox');
    fireEvent.change(regionSelects[0], { target: { value: '13' } });
    await waitFor(() => expect(mockRegionService.getComunas).toHaveBeenCalled());
  });

  it('shows user foto_perfil in detail', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    mockUserService.verUsuario.mockResolvedValue(institucionUser as any);
    renderPage();
    await waitFor(() => screen.getByText('VetCare'));
    fireEvent.click(screen.getAllByText('VetCare')[0].closest('button')!);
    await waitFor(() => {
      const img = document.querySelector('img[alt="Foto"]');
      expect(img).toBeInTheDocument();
    });
  });

  it('shows user count in list', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('1 usuario encontrado')).toBeInTheDocument());
  });

  it('shows plural user count', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser, institucionUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('2 usuarios encontrados')).toBeInTheDocument());
  });

  it('activates inactive user account', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    mockUserService.verUsuario.mockResolvedValue(institucionUser as any);
    mockUserService.cambiarEstadoUsuario.mockResolvedValue({ ...institucionUser, is_active: true } as any);
    renderPage();
    await waitFor(() => screen.getByText('VetCare'));
    fireEvent.click(screen.getAllByText('VetCare')[0].closest('button')!);
    await waitFor(() => screen.getByText('Activar cuenta'));
    fireEvent.click(screen.getByText('Activar cuenta'));
    await waitFor(() =>
      expect(screen.getByText('Cuenta activada correctamente')).toBeInTheDocument()
    );
  });
});
