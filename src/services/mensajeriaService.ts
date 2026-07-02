import axios from 'axios';
import { storage } from '../utils/storage';
import type { Sala, Mensaje, SalaDenuncia } from '../types';

export const MENSAJERIA_URL = import.meta.env.VITE_MS_MENSAJERIA_URL ?? 'http://localhost:3006';

const mensajeriaApi = axios.create({ baseURL: MENSAJERIA_URL });
mensajeriaApi.interceptors.request.use((config) => {
  const token = storage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const listarSalas = async (): Promise<Sala[]> => {
  const { data } = await mensajeriaApi.get<{ ok: boolean; data: Sala[] }>('/salas');
  return data.data;
};

export const obtenerSala = async (salaId: string): Promise<Sala> => {
  const { data } = await mensajeriaApi.get<{ ok: boolean; data: Sala }>(`/salas/${salaId}`);
  return data.data;
};

export const obtenerHistorial = async (salaId: string): Promise<Mensaje[]> => {
  const { data } = await mensajeriaApi.get<{ ok: boolean; data: Mensaje[] }>(
    `/salas/${salaId}/mensajes`,
  );
  return data.data;
};

export const reportarSala = async (salaId: string, motivo?: string): Promise<Sala> => {
  const { data } = await mensajeriaApi.post<{ ok: boolean; data: Sala }>(
    `/salas/${salaId}/reportar`,
    { motivo },
  );
  return data.data;
};

export const cambiarEstadoSala = async (salaId: string, estado: string): Promise<Sala> => {
  const { data } = await mensajeriaApi.patch<{ ok: boolean; data: Sala }>(
    `/salas/${salaId}/estado`,
    { estado },
  );
  return data.data;
};

export interface SalaReportada {
  sala: Sala;
  denuncias: SalaDenuncia[];
}

export const listarSalasReportadas = async (): Promise<SalaReportada[]> => {
  const { data } = await mensajeriaApi.get<{ ok: boolean; data: SalaReportada[] }>('/salas/reportadas');
  return data.data;
};

export const listarSalasClausuradas = async (): Promise<Sala[]> => {
  const { data } = await mensajeriaApi.get<{ ok: boolean; data: Sala[] }>('/salas/clausuradas');
  return data.data;
};

export const uploadImagenMensaje = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('imagen', file);
  const { data } = await mensajeriaApi.post<{ ok: boolean; url: string }>('/mensajes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url;
};
