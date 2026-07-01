import { usersApi } from './api';
import type { User } from '../types';

export const userService = {
  registrarCiudadano: async (formData: FormData): Promise<User> => {
    const { data } = await usersApi.post('/api/users/register/ciudadano', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  registrarInstitucion: async (formData: FormData): Promise<User> => {
    const { data } = await usersApi.post('/api/users/register/institucion', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  obtenerPerfil: async (): Promise<User> => {
    const { data } = await usersApi.get('/api/users/perfil');
    return data.data;
  },

  actualizarPerfil: async (datos: FormData): Promise<User> => {
    const { data } = await usersApi.patch('/api/users/perfil', datos, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  desactivarCuenta: async (): Promise<void> => {
    await usersApi.delete('/api/users/perfil');
  },

  // Password management
  cambiarContrasena: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await usersApi.patch('/api/users/perfil/password', { currentPassword, newPassword });
    return data.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await usersApi.post('/api/users/forgot-password', { email });
    return data.data;
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
    const { data } = await usersApi.patch('/api/users/reset-password', { email, code, newPassword });
    return data.data;
  },

  // Admin
  listarUsuarios: async (filtros?: { rol?: string; is_active?: boolean }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filtros?.rol) params.append('rol', filtros.rol);
    if (filtros?.is_active !== undefined) params.append('is_active', String(filtros.is_active));
    const { data } = await usersApi.get(`/api/users/admin/usuarios?${params.toString()}`);
    return data.data;
  },

  verUsuario: async (userId: string): Promise<User> => {
    const { data } = await usersApi.get(`/api/users/admin/usuarios/${userId}`);
    return data.data;
  },

  verUsuarioPorCredential: async (credentialId: string): Promise<User> => {
    const { data } = await usersApi.get(`/api/users/admin/usuarios/by-credential/${credentialId}`);
    return data.data;
  },

  cambiarEstadoUsuario: async (userId: string, is_active: boolean): Promise<User> => {
    const { data } = await usersApi.patch(`/api/users/admin/usuarios/${userId}/estado`, { is_active });
    return data.data;
  },

  cambiarRolUsuario: async (userId: string, rol: string): Promise<User> => {
    const { data } = await usersApi.patch(`/api/users/admin/usuarios/${userId}/rol`, { rol });
    return data.data;
  },

  editarDatosUsuario: async (userId: string, datos: Record<string, string>): Promise<User> => {
    const { data } = await usersApi.patch(`/api/users/admin/usuarios/${userId}/datos`, datos);
    return data.data;
  },

  getEstadisticas: async (): Promise<{
    total: number;
    activos: number;
    por_region: { region: string; count: number }[];
    top_comunas: { comuna: string; count: number }[];
    por_tipo: { tipo: string; count: number }[];
    por_tipo_institucion: { tipo_institucion: string; count: number }[];
    por_rol: { rol: string; count: number }[];
    por_mes: { mes: string; count: number }[];
    por_mes_tipo: { mes: string; tipo: string; count: number }[];
    por_mes_rol: { mes: string; rol: string; count: number }[];
    por_mes_region_tipo: { mes: string; region: string; tipo: string; count: number }[];
    por_mes_region_rol:  { mes: string; region: string; rol: string; count: number }[];
    por_mes_comuna_tipo: { mes: string; comuna: string; tipo: string; count: number }[];
    por_mes_comuna_rol:  { mes: string; comuna: string; rol: string; count: number }[];
  }> => {
    const { data } = await usersApi.get('/api/users/admin/estadisticas');
    return data.data;
  },
};