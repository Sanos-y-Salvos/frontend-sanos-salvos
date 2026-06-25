import { localizacionApi } from './api'; // Importamos la instancia que apunta al Gateway
import type { PuntoMapa } from '../types';

export const obtenerPuntosCercanos = async (
  lat: number,
  lng: number,
  radio: number = 5000
): Promise<PuntoMapa[]> => {
  // ATENCIÓN AQUÍ CON LA RUTA:
  // Si en tu gateway.config.yml definiste un prefijo para que el Gateway sepa
  // a qué microservicio rutear (ej. '/api/localizacion'), debes agregarlo a la ruta.
  // Si tu Gateway rutea la raíz directamente, déjalo como '/mapa/puntos'.
  
  const { data } = await localizacionApi.get<PuntoMapa[]>('/api/localizacion/mapa/puntos', {
    params: { lat, lng, radio },
  });
  
  return data;
}