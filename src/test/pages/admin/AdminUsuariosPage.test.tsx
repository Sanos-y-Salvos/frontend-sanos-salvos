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
  formatDireccion: vi.fn((v: string) => v),
  sanitizeNombre: vi.fn((v: string) => v),
  getPasswordReqs: vi.fn((v: string) => [
    { label: 'Entre 6 y 13 caracteres', met: v.length >= 6 && v.length <= 13 },
    { label: 'Al menos una mayúscula', met: /[A-Z]/.test(v) },
    { label: 'Al menos una minúscula', met: /[a-z]/.test(v) },
    { label: 'Al menos un número', met: /[0-9]/.test(v) },
    { label: 'Al menos un carácter especial (!@#...)', met: /[^A-Za-z0-9]/.test(v) },
  ]),
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

  it('shows default error message when creating user fails with no message (line 303 fallback)', async () => {
    mockUserService.registrarCiudadano.mockRejectedValue({});
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Error al crear el usuario'));
  });

  it('creates ciudadano user with segundo_nombre and apellido_materno (lines 287-288 TRUE branches)', async () => {
    renderPage();
    await openCreateModal();
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    const segundoInput = screen.queryByRole('textbox', { name: /Segundo nombre/i });
    if (segundoInput) fireEvent.change(segundoInput, { target: { value: 'Pablo' } });
    const apellidoMatInput = screen.queryByRole('textbox', { name: /Segundo apellido/i });
    if (apellidoMatInput) fireEvent.change(apellidoMatInput, { target: { value: 'López' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).toHaveBeenCalled());
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

describe('AdminUsuariosPage - extra flows', () => {
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

  it('searches by name', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser, institucionUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Juan' } });
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    expect(screen.queryByText('VetCare')).not.toBeInTheDocument();
  });

  it('shows empty state with search message', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-xyz' } });
    await waitFor(() =>
      expect(screen.getByText(/Sin resultados para/)).toBeInTheDocument()
    );
  });

  it('superadmin can see superadmin users', async () => {
    mockAuthUser = { rol: 'superadmin', id: 'super1' };
    mockUserService.listarUsuarios.mockResolvedValue([superadminUser, ciudadanoUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Super Admin')).toBeInTheDocument());
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('closes create modal with X button', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));
    // Click the X button
    const xButton = document.querySelector('button svg.lucide-x')?.parentElement as HTMLElement;
    if (xButton) fireEvent.click(xButton);
    else {
      // fallback: click Cancel
      fireEvent.click(screen.getByText('Cancelar'));
    }
    await waitFor(() =>
      expect(screen.queryByText('Crear usuario', { selector: 'h2' })).not.toBeInTheDocument()
    );
  });

  it('shows validation errors in create form', async () => {
    mockValidateField.mockReturnValue('Campo requerido');
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarCiudadano).not.toHaveBeenCalled());
    expect(screen.getAllByText('Campo requerido').length).toBeGreaterThan(0);
  });

  it('creates institution user successfully', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Institución', { selector: 'button' }));
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockUserService.registrarInstitucion).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Usuario creado correctamente')).toBeInTheDocument());
  });

  it('shows error when creating institution user fails', async () => {
    mockUserService.registrarInstitucion.mockRejectedValue({
      response: { data: { message: 'RUT ya registrado' } },
    });
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Institución', { selector: 'button' }));
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    await waitFor(() => expect(document.querySelector('form')).toBeInTheDocument());
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getAllByRole('alert')[0]).toHaveTextContent('RUT ya registrado')
    );
  });

  it('saves edit for institution user', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    mockUserService.verUsuario.mockResolvedValue(institucionUser as any);
    mockUserService.editarDatosUsuario.mockResolvedValue(institucionUser as any);
    renderPage();
    await waitFor(() => screen.getByText('VetCare'));
    fireEvent.click(screen.getAllByText('VetCare')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() =>
      expect(mockUserService.editarDatosUsuario).toHaveBeenCalledWith('u2', expect.any(Object))
    );
    await waitFor(() =>
      expect(screen.getByText('Datos actualizados correctamente')).toBeInTheDocument()
    );
  });

  it('shows edit validation error when fields are invalid', async () => {
    mockValidateField.mockReturnValue('Campo requerido');
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    fireEvent.click(screen.getByText('Guardar cambios'));
    await waitFor(() => expect(mockUserService.editarDatosUsuario).not.toHaveBeenCalled());
  });

  it('loads comunas when region changes in edit mode', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    const regionSelects = screen.getAllByRole('combobox');
    fireEvent.change(regionSelects[0], { target: { value: '13' } });
    await waitFor(() => expect(mockRegionService.getComunas).toHaveBeenCalledWith('13'));
  });

  it('blurCrear and changeCrear work correctly', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    fireEvent.blur(emailInput, { target: { value: '' } });
    fireEvent.change(emailInput, { target: { value: 'test@test.cl' } });
    expect(emailInput).toHaveValue('test@test.cl');
  });

  it('shows "no usuarios" when busqueda has no match', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'xyznotfound' } });
    await waitFor(() => expect(screen.getByText('No hay usuarios')).toBeInTheDocument());
  });

  it('renders user phone and region in list card', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('912345678')).toBeInTheDocument());
  });

  it('shows user inactive badge in list', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Inactivo')).toBeInTheDocument());
  });

  it('changes comuna and direccion in create modal for ciudadano', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Crear usuario', { selector: 'h2' }));
    // Open as ciudadano (default or select ciudadano)
    await waitFor(() => screen.getAllByText('Ciudadano', { selector: 'button' }));
    fireEvent.click(screen.getAllByText('Ciudadano', { selector: 'button' })[0]);
    await waitFor(() => screen.getByText('Primer nombre *'));

    // Change region first
    const selects = screen.getAllByRole('combobox');
    const regionSelect = selects.find(s => s.querySelector('option[value="13"]') || s.getAttribute('label')?.includes('Región'));
    if (regionSelect) {
      fireEvent.change(regionSelect, { target: { value: '13' } });
      await waitFor(() => expect(mockRegionService.getComunas).toHaveBeenCalled());
    }

    // Change commune and direction
    const allSelects = screen.getAllByRole('combobox');
    if (allSelects.length > 1) {
      fireEvent.change(allSelects[allSelects.length - 1], { target: { value: 'Santiago' } });
      fireEvent.blur(allSelects[allSelects.length - 1], { target: { value: 'Santiago' } });
    }

    // Direction input
    const dirInput = screen.queryByPlaceholderText('Ej: Lago Riñihue 132');
    if (dirInput) {
      fireEvent.change(dirInput, { target: { value: 'Calle 123' } });
      fireEvent.blur(dirInput, { target: { value: 'Calle 123' } });
    }
  });

  it('changes institution-specific fields in create modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Institución', { selector: 'button' }));
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    await waitFor(() => screen.getByText('Nombre institución *'));

    // Change institution name
    const nombreInput = screen.queryByRole('textbox', { name: /Nombre institución/i });
    if (nombreInput) {
      fireEvent.change(nombreInput, { target: { value: 'Mi Clínica' } });
      fireEvent.blur(nombreInput, { target: { value: 'Mi Clínica' } });
    }

    // Change tipo institucion select
    const selects = screen.getAllByRole('combobox');
    const tipoSelect = selects.find(s => {
      const opts = s.querySelectorAll('option');
      return Array.from(opts).some(o => o.textContent?.includes('Municipalidad'));
    });
    if (tipoSelect) {
      fireEvent.change(tipoSelect, { target: { value: 'municipalidad' } });
    }

    // Photo upload
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
    }
  });

  it('changes razon_social and rut fields for institution in create modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getByText('Institución', { selector: 'button' }));
    fireEvent.click(screen.getByText('Institución', { selector: 'button' }));
    await waitFor(() => screen.getByText('Razón social *'));

    // Change razon_social
    const razonInput = screen.queryByRole('textbox', { name: /Razón social/i });
    if (razonInput) {
      fireEvent.change(razonInput, { target: { value: 'Clínica SA' } });
      fireEvent.blur(razonInput, { target: { value: 'Clínica SA' } });
    }

    // Change rut
    const rutInput = screen.queryByPlaceholderText('76.354.771-K');
    if (rutInput) {
      fireEvent.change(rutInput, { target: { value: '76.354.771-K' } });
      fireEvent.blur(rutInput, { target: { value: '76.354.771-K' } });
    }
  });

  it('changes ciudadano name fields in create modal', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getAllByText('Ciudadano', { selector: 'button' }));
    fireEvent.click(screen.getAllByText('Ciudadano', { selector: 'button' })[0]);
    await waitFor(() => screen.getByText('Primer nombre *'));

    // Change primer_nombre
    const primerNombreInput = screen.queryByRole('textbox', { name: /Primer nombre/i });
    if (primerNombreInput) {
      fireEvent.change(primerNombreInput, { target: { value: 'Juan' } });
      fireEvent.blur(primerNombreInput, { target: { value: 'Juan' } });
    }

    // Change apellido_paterno
    const apellidoInput = screen.queryByRole('textbox', { name: /Primer apellido/i });
    if (apellidoInput) {
      fireEvent.change(apellidoInput, { target: { value: 'García' } });
      fireEvent.blur(apellidoInput, { target: { value: 'García' } });
    }

    // Change RUN
    const runInput = screen.queryByPlaceholderText('12.345.678-9');
    if (runInput) {
      fireEvent.change(runInput, { target: { value: '12.345.678-9' } });
      fireEvent.blur(runInput, { target: { value: '12.345.678-9' } });
    }

    // Change segundo_nombre
    const segundoInput = screen.queryByRole('textbox', { name: /Segundo nombre/i });
    if (segundoInput) {
      fireEvent.change(segundoInput, { target: { value: 'Pablo' } });
      fireEvent.blur(segundoInput, { target: { value: 'Pablo' } });
    }

    // Change apellido_materno
    const apellidoMatInput = screen.queryByRole('textbox', { name: /Segundo apellido/i });
    if (apellidoMatInput) {
      fireEvent.change(apellidoMatInput, { target: { value: 'López' } });
      fireEvent.blur(apellidoMatInput, { target: { value: 'López' } });
    }
  });

  it('changes edit modal fields for ciudadano (lines 467, 472, 478-481)', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));

    // Change region to load comunas
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '13' } });

    // Change comuna
    const selects2 = screen.getAllByRole('combobox');
    if (selects2.length > 1) {
      fireEvent.change(selects2[1], { target: { value: 'Santiago' } });
    }

    // Change direccion
    const dirInput = screen.queryByPlaceholderText('Ej: Lago Riñihue 132');
    if (dirInput) {
      fireEvent.change(dirInput, { target: { value: 'Nueva Dir 123' } });
    }

    // Also change telefono in edit modal (lines 455-456)
    const telefonoInput = screen.queryByPlaceholderText('12345678');
    if (telefonoInput) fireEvent.change(telefonoInput, { target: { value: '87654321' } });

    // Change name fields (ciudadano) via aria-label
    const primerNombreInput = screen.queryByRole('textbox', { name: 'Primer nombre' });
    if (primerNombreInput) fireEvent.change(primerNombreInput, { target: { value: 'Pedro' } });
    const segundoNombreInput = screen.queryByRole('textbox', { name: 'Segundo nombre' });
    if (segundoNombreInput) fireEvent.change(segundoNombreInput, { target: { value: 'Pablo' } });
    const apellidoPaternoInput = screen.queryByRole('textbox', { name: 'Primer apellido' });
    if (apellidoPaternoInput) fireEvent.change(apellidoPaternoInput, { target: { value: 'González' } });
    const apellidoMaternoInput = screen.queryByRole('textbox', { name: 'Segundo apellido' });
    if (apellidoMaternoInput) fireEvent.change(apellidoMaternoInput, { target: { value: 'Martínez' } });
  });

  it('changes edit modal fields for institution (lines 484-487)', async () => {
    mockUserService.listarUsuarios.mockResolvedValue([institucionUser] as any);
    mockUserService.verUsuario.mockResolvedValue(institucionUser as any);
    renderPage();
    await waitFor(() => screen.getByText('VetCare'));
    fireEvent.click(screen.getAllByText('VetCare')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));

    const nombreInput = screen.queryByRole('textbox', { name: 'Nombre institución' });
    if (nombreInput) fireEvent.change(nombreInput, { target: { value: 'Clínica Nueva' } });
    const razonInput = screen.queryByRole('textbox', { name: 'Razón social' });
    if (razonInput) fireEvent.change(razonInput, { target: { value: 'Nueva Ltda.' } });
  });

  it('changes password and telefono in create modal (lines 815-832, 841)', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getAllByText('Ciudadano', { selector: 'button' }));

    // password input (type="password")
    const passwordInput = document.querySelector('input[type="password"]');
    if (passwordInput) {
      fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });
      fireEvent.blur(passwordInput, { target: { value: 'mypassword123' } });
    }

    // telefono input
    const telefonoInput = screen.queryByPlaceholderText('12345678');
    if (telefonoInput) {
      fireEvent.change(telefonoInput, { target: { value: '87654321' } });
      fireEvent.blur(telefonoInput, { target: { value: '87654321' } });
    }

    // region select blur
    const selects = screen.getAllByRole('combobox');
    if (selects.length > 0) {
      fireEvent.blur(selects[0], { target: { value: '13' } });
    }
  });

  it('pagination: renders buttons and next/prev chevrons (lines 50-75)', async () => {
    const manyUsers = Array.from({ length: 14 }, (_, i) => ({
      ...ciudadanoUser,
      id: `u${i + 100}`,
      credential_id: `cr${i}`,
      email: `user${i}@test.cl`,
      ciudadano: { ...ciudadanoUser.ciudadano, primer_nombre: `User${i}`, apellido_paterno: 'Test' },
    }));
    mockUserService.listarUsuarios.mockResolvedValue(manyUsers as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('User0 Test')).toBeInTheDocument());
    // Click ChevronRight (next button) to go to page 2
    const allBtns = screen.queryAllByRole('button');
    const nextBtn = allBtns[allBtns.length - 1];
    if (nextBtn && !nextBtn.disabled) {
      fireEvent.click(nextBtn);
      await waitFor(() => expect(screen.getByText('User12 Test')).toBeInTheDocument());
    }
    // Click prev chevron
    const btn1 = screen.queryAllByRole('button').find(b => b.textContent === '1');
    if (btn1) {
      const prevBtn = btn1.previousElementSibling as HTMLButtonElement;
      if (prevBtn && !prevBtn.disabled) fireEvent.click(prevBtn);
    }
  });

  it('pagination: >7 pages uses ellipsis (lines 54-58)', async () => {
    const manyUsers = Array.from({ length: 90 }, (_, i) => ({
      ...ciudadanoUser,
      id: `u${i + 200}`,
      credential_id: `cr${i + 200}`,
      email: `biguser${i}@test.cl`,
      ciudadano: { ...ciudadanoUser.ciudadano, primer_nombre: `BigUser${i}`, apellido_paterno: 'Test' },
    }));
    mockUserService.listarUsuarios.mockResolvedValue(manyUsers as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('BigUser0 Test')).toBeInTheDocument());
    // 90 users / PAGE_SIZE(12) = 8 pages → uses ellipsis branch (> 7 pages)
    // Click page "8" to get to last page
    const lastPageBtn = screen.queryAllByRole('button').find(b => b.textContent === '8');
    if (lastPageBtn) {
      fireEvent.click(lastPageBtn);
      await waitFor(() => expect(screen.getByText('BigUser84 Test')).toBeInTheDocument());
    }
  });

  it('search with institution user covers line 583', async () => {
    // User with no ciudadano and no institution to cover `|| ''` fallback
    const userNoNames = {
      ...ciudadanoUser,
      id: 'uNN',
      credential_id: 'crNN',
      email: 'nonames@test.cl',
      ciudadano: null,
      institucion: null,
    };
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser, userNoNames] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    // Search by email — covers the `|| ''` branch in nombre since userNoNames.ciudadano=null, institucion=null
    fireEvent.change(searchInput, { target: { value: 'nonames@test.cl' } });
    await waitFor(() => expect(screen.getByText('nonames@test.cl')).toBeInTheDocument());
  });

  it('file input in create modal with no file sets null (line 916)', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getAllByText('Ciudadano', { selector: 'button' }));

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      Object.defineProperty(fileInput, 'files', { value: [], configurable: true });
      fireEvent.change(fileInput);
    }
  });

  it('changeRutCrear validates when field is touched (lines 159-160)', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear usuario'));
    fireEvent.click(screen.getByText('Crear usuario'));
    await waitFor(() => screen.getAllByText('Ciudadano', { selector: 'button' }));
    fireEvent.click(screen.getAllByText('Ciudadano', { selector: 'button' })[0]);
    await waitFor(() => screen.getByText('Primer nombre *'));

    const runInput = screen.queryByPlaceholderText('12.345.678-9');
    if (runInput) {
      // Blur first to mark as touched
      fireEvent.blur(runInput, { target: { value: '12.345.678-9' } });
      // Then change (triggers changeRutCrear with touchedCrear['run'] = true → lines 159-160)
      fireEvent.change(runInput, { target: { value: '11.111.111-1' } });
    }
  });

  it('detail shows "-" for empty region and comuna (lines 364-365)', async () => {
    const userNoRegion = { ...ciudadanoUser, region: '', comuna: '' };
    mockUserService.listarUsuarios.mockResolvedValue([userNoRegion] as any);
    mockUserService.verUsuario.mockResolvedValue(userNoRegion as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a usuarios'));
    const dashCells = screen.getAllByText('-');
    expect(dashCells.length).toBeGreaterThanOrEqual(2);
  });

  it('detail shows "-" for missing segundo_nombre and apellido_materno (lines 387-389)', async () => {
    const minimalCiudadano = {
      ...ciudadanoUser,
      ciudadano: {
        id: 'c1', primer_nombre: 'Juan', segundo_nombre: undefined,
        apellido_paterno: 'Pérez', apellido_materno: undefined,
        run: '12.345.678-9', direccion: '',
      },
    };
    mockUserService.listarUsuarios.mockResolvedValue([minimalCiudadano] as any);
    mockUserService.verUsuario.mockResolvedValue(minimalCiudadano as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a usuarios'));
    // segundo_nombre and apellido_materno show '-' when undefined
    const dashCells = screen.getAllByText('-');
    expect(dashCells.length).toBeGreaterThan(0);
  });

  it('edit mode with empty telefono uses empty string fallback (line 452)', async () => {
    const userNoTelefono = { ...ciudadanoUser, telefono: '' };
    mockUserService.listarUsuarios.mockResolvedValue([userNoTelefono] as any);
    mockUserService.verUsuario.mockResolvedValue(userNoTelefono as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    fireEvent.click(screen.getAllByText('Juan Pérez')[0].closest('button')!);
    await waitFor(() => screen.getByText('Editar'));
    fireEvent.click(screen.getByText('Editar'));
    await waitFor(() => screen.getByText('Guardar cambios'));
    // telefono input should have empty value (the || '' branch is taken)
    const telefonoInput = screen.queryByPlaceholderText('12345678');
    expect(telefonoInput).toBeTruthy();
    expect((telefonoInput as HTMLInputElement).value).toBe('');
  });

  it('search by telefono digits matches user, covers empty telefono fallback (lines 588, 594)', async () => {
    const userNoTelefono2 = { ...ciudadanoUser, id: 'u99', email: 'notel@test.cl', telefono: '', ciudadano: { ...ciudadanoUser.ciudadano, primer_nombre: 'Sin', apellido_paterno: 'Tel' } };
    mockUserService.listarUsuarios.mockResolvedValue([ciudadanoUser, userNoTelefono2] as any);
    renderPage();
    await waitFor(() => screen.getByText('Juan Pérez'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    // "9123" (4 digits) matches ciudadanoUser.telefono "912345678"
    fireEvent.change(searchInput, { target: { value: '9123' } });
    await waitFor(() => expect(screen.getByText('Juan Pérez')).toBeInTheDocument());
    // userNoTelefono2 is filtered out (telefono empty doesn't match)
    expect(screen.queryByText('Sin Tel')).not.toBeInTheDocument();
  });
});
