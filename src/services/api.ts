import axios from 'axios';
import { storage } from '../utils/storage';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8000';

export const localizacionApi = axios.create({ baseURL: GATEWAY_URL });
export const reportesApi = axios.create({ baseURL: GATEWAY_URL });
export const authApi = axios.create({ baseURL: GATEWAY_URL });
export const usersApi = axios.create({ baseURL: GATEWAY_URL });
export const soporteApi = axios.create({ baseURL: GATEWAY_URL });

// Interceptor de request: agrega el access token
const addAuthInterceptor = (instance: typeof authApi) => {
  instance.interceptors.request.use((config) => {
    const token = storage.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

addAuthInterceptor(authApi);
addAuthInterceptor(usersApi);
addAuthInterceptor(soporteApi);
addAuthInterceptor(localizacionApi);
addAuthInterceptor(reportesApi);

// Interceptor de response: reintenta con refresh token ante 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (newToken: string) => {
  refreshQueue.forEach((cb) => cb(newToken));
  refreshQueue = [];
};

const addRefreshInterceptor = (instance: typeof authApi) => {
  instance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;
      if (error.response?.status !== 401 || original._retry) {
        return Promise.reject(error);
      }
      original._retry = true;

      const refreshToken = storage.getRefreshToken();
      if (!refreshToken) {
        storage.clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(instance(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${GATEWAY_URL}/api/auth/refresh`, { refreshToken });
        const newAccessToken: string = data.accessToken;
        storage.setTokens(newAccessToken, data.refreshToken ?? refreshToken);
        processQueue(newAccessToken);
        original.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(original);
      } catch {
        storage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    },
  );
};

addRefreshInterceptor(authApi);
addRefreshInterceptor(usersApi);
addRefreshInterceptor(soporteApi);
addRefreshInterceptor(localizacionApi);
addRefreshInterceptor(reportesApi);
