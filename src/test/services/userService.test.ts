import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/userService';

vi.mock('../../services/api', () => ({
  usersApi: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { usersApi } from '../../services/api';
const mockPost  = vi.mocked(usersApi.post);
const mockGet   = vi.mocked(usersApi.get);
const mockPatch = vi.mocked(usersApi.patch);
const mockDel   = vi.mocked(usersApi.delete);

const mockUser = { id: 'u1', email: 'a@b.com', rol: 'ciudadano' };

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registrarCiudadano posts multipart form and returns user', async () => {
    mockPost.mockResolvedValue({ data: { data: mockUser } });
    const fd = new FormData();
    const result = await userService.registrarCiudadano(fd);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/users/register/ciudadano', fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(result).toEqual(mockUser);
  });

  it('registrarInstitucion posts multipart form and returns user', async () => {
    mockPost.mockResolvedValue({ data: { data: mockUser } });
    const fd = new FormData();
    const result = await userService.registrarInstitucion(fd);
    expect(mockPost).toHaveBeenCalledWith(
      '/api/users/register/institucion', fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(result).toEqual(mockUser);
  });

  it('obtenerPerfil calls GET /api/users/perfil', async () => {
    mockGet.mockResolvedValue({ data: { data: mockUser } });
    const result = await userService.obtenerPerfil();
    expect(mockGet).toHaveBeenCalledWith('/api/users/perfil');
    expect(result).toEqual(mockUser);
  });

  it('actualizarPerfil patches with form data', async () => {
    mockPatch.mockResolvedValue({ data: { data: mockUser } });
    const fd = new FormData();
    const result = await userService.actualizarPerfil(fd);
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/perfil', fd,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    expect(result).toEqual(mockUser);
  });

  it('desactivarCuenta calls DELETE /api/users/perfil', async () => {
    mockDel.mockResolvedValue({ data: {} });
    await userService.desactivarCuenta();
    expect(mockDel).toHaveBeenCalledWith('/api/users/perfil');
  });

  it('cambiarContrasena patches password endpoint', async () => {
    mockPatch.mockResolvedValue({ data: { data: { message: 'ok' } } });
    const result = await userService.cambiarContrasena('old', 'new');
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/perfil/password', { currentPassword: 'old', newPassword: 'new' }
    );
    expect(result).toEqual({ message: 'ok' });
  });

  it('forgotPassword posts email', async () => {
    mockPost.mockResolvedValue({ data: { data: { message: 'sent' } } });
    const result = await userService.forgotPassword('a@b.com');
    expect(mockPost).toHaveBeenCalledWith('/api/users/forgot-password', { email: 'a@b.com' });
    expect(result).toEqual({ message: 'sent' });
  });

  it('resetPassword patches with email, code and newPassword', async () => {
    mockPatch.mockResolvedValue({ data: { data: { message: 'reset' } } });
    const result = await userService.resetPassword('a@b.com', '1234', 'Abc1!xyz');
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/reset-password', { email: 'a@b.com', code: '1234', newPassword: 'Abc1!xyz' }
    );
    expect(result).toEqual({ message: 'reset' });
  });

  it('listarUsuarios calls GET with no filters', async () => {
    mockGet.mockResolvedValue({ data: { data: [mockUser] } });
    const result = await userService.listarUsuarios();
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/usuarios?');
    expect(result).toEqual([mockUser]);
  });

  it('listarUsuarios calls GET with rol filter', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await userService.listarUsuarios({ rol: 'ciudadano' });
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/usuarios?rol=ciudadano');
  });

  it('listarUsuarios calls GET with is_active filter', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await userService.listarUsuarios({ is_active: true });
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/usuarios?is_active=true');
  });

  it('listarUsuarios calls GET with both filters', async () => {
    mockGet.mockResolvedValue({ data: { data: [] } });
    await userService.listarUsuarios({ rol: 'moderador', is_active: false });
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/usuarios?rol=moderador&is_active=false');
  });

  it('verUsuario calls GET with user id', async () => {
    mockGet.mockResolvedValue({ data: { data: mockUser } });
    const result = await userService.verUsuario('u1');
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/usuarios/u1');
    expect(result).toEqual(mockUser);
  });

  it('cambiarEstadoUsuario patches estado', async () => {
    mockPatch.mockResolvedValue({ data: { data: mockUser } });
    const result = await userService.cambiarEstadoUsuario('u1', false);
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/admin/usuarios/u1/estado', { is_active: false }
    );
    expect(result).toEqual(mockUser);
  });

  it('cambiarRolUsuario patches rol', async () => {
    mockPatch.mockResolvedValue({ data: { data: mockUser } });
    const result = await userService.cambiarRolUsuario('u1', 'moderador');
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/admin/usuarios/u1/rol', { rol: 'moderador' }
    );
    expect(result).toEqual(mockUser);
  });

  it('editarDatosUsuario patches datos', async () => {
    mockPatch.mockResolvedValue({ data: { data: mockUser } });
    const result = await userService.editarDatosUsuario('u1', { primer_nombre: 'Juan' });
    expect(mockPatch).toHaveBeenCalledWith(
      '/api/users/admin/usuarios/u1/datos', { primer_nombre: 'Juan' }
    );
    expect(result).toEqual(mockUser);
  });

  it('getEstadisticas calls GET estadisticas endpoint', async () => {
    const stats = { total: 100, activos: 80, por_region: [], top_comunas: [], por_tipo: [], por_tipo_institucion: [], por_rol: [], por_mes: [], por_mes_tipo: [], por_mes_rol: [] };
    mockGet.mockResolvedValue({ data: { data: stats } });
    const result = await userService.getEstadisticas();
    expect(mockGet).toHaveBeenCalledWith('/api/users/admin/estadisticas');
    expect(result).toEqual(stats);
  });

  it('throws when API rejects', async () => {
    mockGet.mockRejectedValue(new Error('network'));
    await expect(userService.obtenerPerfil()).rejects.toThrow('network');
  });
});
