import { authApi } from './api';
import type { AuthTokens } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<AuthTokens> => {
    const { data } = await authApi.post('/api/auth/login', { email, password });
    return data.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await authApi.post('/api/auth/logout', { refreshToken });
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const { data } = await authApi.post('/api/auth/refresh', { refreshToken });
    return data.data;
  },

  getMe: async (): Promise<{
    id: string; email: string; role: string; permissions: string[] | null;
    name: string; avatarUrl?: string; status: string; tipo: 'ciudadano' | 'institucion';
    telefono?: string; region?: string; comuna?: string;
    primer_nombre?: string; segundo_nombre?: string; apellido_paterno?: string; apellido_materno?: string;
    run?: string; direccion?: string;
    razon_social?: string; rut?: string; tipo_institucion?: string;
  }> => {
    const { data } = await authApi.get('/api/auth/me');
    return data.data;
  },
};