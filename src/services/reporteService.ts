import axios from 'axios'
import type { Reporte } from '../types'

const reporteApi = axios.create({
  baseURL: import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003',
})

export interface FiltrosReporte {
  tipo?: string
  estado?: string
  especie?: string
  color?: string
}

export const listarReportes = async (filtros?: FiltrosReporte): Promise<Reporte[]> => {
  const { data } = await reporteApi.get<{ data: Reporte[] }>('/reportes', {
    params: filtros,
  })
  return data.data
}

export const obtenerReporte = async (id: string): Promise<Reporte> => {
  const { data } = await reporteApi.get<{ data: Reporte }>(`/reportes/${id}`)
  return data.data
}
