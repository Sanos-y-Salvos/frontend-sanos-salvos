import axios from 'axios';
import { storage } from '../utils/storage';

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_MS_AUTH_URL ?? '',
});

export const usersApi = axios.create({
  baseURL: import.meta.env.VITE_MS_USERS_URL ?? '',
});

export const soporteApi = axios.create({
  baseURL: import.meta.env.VITE_MS_SOPORTE_URL ?? '',
});

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

addAuthInterceptor(authApi);
addAuthInterceptor(usersApi);
addAuthInterceptor(soporteApi);