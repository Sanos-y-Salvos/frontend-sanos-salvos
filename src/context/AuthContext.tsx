import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthTokens } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { storage } from '../utils/storage';

// Construye un User desde el caché Redis cuando ms-users está caído
const userDesdeCache = (cached: Awaited<ReturnType<typeof authService.getMe>>): User => {
  const u: User = {
    id: cached.id,
    credential_id: cached.id,
    email: cached.email,
    telefono: cached.telefono ?? '',
    rol: cached.role,
    tipo: cached.tipo,
    region: cached.region ?? '',
    comuna: cached.comuna ?? '',
    is_active: cached.status === 'active',
    foto_perfil: cached.avatarUrl,
  };

  if (cached.tipo === 'ciudadano') {
    const partes = (cached.name || '').trim().split(' ');
    u.ciudadano = {
      id: '',
      primer_nombre: cached.primer_nombre ?? partes[0] ?? '',
      segundo_nombre: cached.segundo_nombre,
      apellido_paterno: cached.apellido_paterno ?? (partes.slice(1).join(' ') || ''),
      apellido_materno: cached.apellido_materno,
      run: cached.run ?? '',
      direccion: cached.direccion ?? '',
    };
  } else {
    u.institucion = {
      id: '',
      nombre_institucion: cached.name || '',
      razon_social: cached.razon_social ?? '',
      rut: cached.rut ?? '',
      tipo_institucion: cached.tipo_institucion ?? '',
      direccion: cached.direccion ?? '',
    };
  }

  return u;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = storage.getAccessToken();
      if (token) {
        try {
          // 1. Fuente de verdad: ms-users
          const perfil = await userService.obtenerPerfil();
          setUser(perfil);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            storage.clearTokens();
          } else {
            // 2. ms-users caído — intentar Redis vía ms-auth
            try {
              const cached = await authService.getMe();
              setUser(userDesdeCache(cached));
            } catch {
              // 3. Todo caído — sesión inválida
              storage.clearTokens();
            }
          }
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const tokens: AuthTokens = await authService.login(email, password);
    storage.setTokens(tokens.accessToken, tokens.refreshToken);
    try {
      const perfil = await userService.obtenerPerfil();
      setUser(perfil);
      return perfil;
    } catch {
      try {
        const cached = await authService.getMe();
        const u = userDesdeCache(cached);
        setUser(u);
        return u;
      } catch {
        storage.clearTokens();
        throw new Error('No se pudo obtener los datos del usuario');
      }
    }
  };

  const logout = async () => {
    const refreshToken = storage.getRefreshToken();
    if (refreshToken) {
      await authService.logout(refreshToken).catch(() => {});
    }
    storage.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};