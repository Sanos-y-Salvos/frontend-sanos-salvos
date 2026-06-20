import { reportesApi } from './api'
import type { Reporte } from '../types'

export interface FiltrosReporte {
  tipo?: string
  estado?: string
  especie?: string
  color?: string
}

export const listarReportes = async (filtros?: FiltrosReporte): Promise<Reporte[]> => {
  const { data } = await reportesApi.get<{ data: Reporte[] }>('/api/mascotas/reportes', {
    params: filtros,
  })
  return data.data
}

export const obtenerReporte = async (id: string): Promise<Reporte> => {
  const { data } = await reportesApi.get<{ data: Reporte }>(`/api/mascotas/reportes/${id}`)
  return data.data
}

export interface NuevoReporte {
  nombreMascota: string
  especie: string
  color: string
  tamanio: string
  tipo: string
  ubicacionLatitud: number
  ubicacionLongitud: number
  direccionReferencia?: string
  descripcion?: string
  fotos?: File[]
}

export interface EstadisticasReportes {
  total: number;
  por_tipo:        { tipo: string;    count: number }[];
  por_estado:      { estado: string;  count: number }[];
  por_especie:     { especie: string; count: number }[];
  por_tamanio:     { tamanio: string; count: number }[];
  por_mes:         { mes: string; count: number }[];
  por_mes_tipo:    { mes: string; tipo: string; count: number }[];
  por_mes_especie: { mes: string; especie: string; count: number }[];
}

export const getEstadisticasReportes = async (): Promise<EstadisticasReportes> => {
  const { data } = await reportesApi.get<{ data: EstadisticasReportes }>('/api/mascotas/reportes/estadisticas');
  return data.data;
};

export const crearReporte = async (reporte: NuevoReporte): Promise<Reporte> => {
  const formData = new FormData()
  formData.append('nombreMascota', reporte.nombreMascota)
  formData.append('especie', reporte.especie)
  formData.append('color', reporte.color)
  formData.append('tamanio', reporte.tamanio)
  formData.append('tipo', reporte.tipo)
  formData.append('ubicacionLatitud', String(reporte.ubicacionLatitud))
  formData.append('ubicacionLongitud', String(reporte.ubicacionLongitud))
  if (reporte.direccionReferencia) formData.append('direccionReferencia', reporte.direccionReferencia)
  if (reporte.descripcion) formData.append('descripcion', reporte.descripcion)
  reporte.fotos?.forEach((foto) => formData.append('fotos', foto))

  const { data } = await reportesApi.post<{ data: Reporte }>('/api/mascotas/reportes', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}