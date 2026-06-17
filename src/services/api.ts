import axios from 'axios';
import { storage } from '../utils/storage';

// =======================================================
// 1. MICROSERVICIOS YA MOGRADOS AL API GATEWAY
// =======================================================
const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8000';

export const localizacionApi = axios.create({
  baseURL: GATEWAY_URL, 
  // Ojo: En tus servicios de localización, ahora tus fetch deben 
  // empezar por el prefijo que definiste en el gateway (ej: '/api/localizacion/...')
});

export const reportesApi = axios.create({
  baseURL: GATEWAY_URL,
  // Igual aquí, usar el prefijo del gateway (ej: '/api/mascotas/...')
});

// =======================================================
// 2. MICROSERVICIOS PENDIENTES (CONEXIÓN DIRECTA)
// =======================================================
// TODO A FUTURO: Cuando estos microservicios se agreguen al gateway.config.yml,
// debes cambiar su 'baseURL' para que usen GATEWAY_URL y eliminar sus variables de entorno.
export const authApi = axios.create({
  baseURL: import.meta.env.VITE_MS_AUTH_URL ?? '',
});

export const usersApi = axios.create({
  baseURL: import.meta.env.VITE_MS_USERS_URL ?? '',
});

export const soporteApi = axios.create({
  baseURL: import.meta.env.VITE_MS_SOPORTE_URL ?? '',
});

// =======================================================
// 3. INTERCEPTOR DE AUTENTICACIÓN
// =======================================================
// Interceptor para agregar token en cada petición
const addAuthInterceptor = (instance: typeof authApi) => {
  instance.interceptors.request.use((config) => {
    const token = storage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

// Se lo aplicamos a las APIs antiguas
addAuthInterceptor(authApi);
addAuthInterceptor(usersApi);
addAuthInterceptor(soporteApi);

// Y se lo aplicamos a las nuevas del Gateway
addAuthInterceptor(localizacionApi);
addAuthInterceptor(reportesApi);