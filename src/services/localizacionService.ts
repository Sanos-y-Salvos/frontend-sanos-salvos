import axios from 'axios'
import type { PuntoMapa } from '../types'

const localizacionApi = axios.create({
  baseURL: import.meta.env.VITE_MS_LOCALIZACION_URL ?? 'http://localhost:3004',
})

export const obtenerPuntosCercanos = async (
  lat: number,
  lng: number,
  radio: number = 5000
): Promise<PuntoMapa[]> => {
  const { data } = await localizacionApi.get<PuntoMapa[]>('/mapa/puntos', {
    params: { lat, lng, radio },
  })
  return data
}
