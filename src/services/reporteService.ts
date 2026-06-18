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