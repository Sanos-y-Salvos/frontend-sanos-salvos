import axios from 'axios';
import { storage } from '../utils/storage';
import type { Match } from '../types';

const GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL ?? 'http://localhost:8000';

const matchingApi = axios.create({ baseURL: GATEWAY_URL });
matchingApi.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listarMatchesPorReporte = async (reporteId: string): Promise<Match[]> => {
  const { data } = await matchingApi.get<Match[]>(`/api/matching/matches/${reporteId}`);
  return data;
};

export const actualizarEstadoMatch = async (
  matchId: string,
  estado: 'ACEPTADO' | 'RECHAZADO',
): Promise<Match> => {
  const { data } = await matchingApi.patch<Match>(`/api/matching/matches/${matchId}`, { estado });
  return data;
};
