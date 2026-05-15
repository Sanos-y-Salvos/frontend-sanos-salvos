import regionesComunas from '../data/regiones-comunas.json';

export const regionService = {
  getRegiones: async () => {
    return regionesComunas.regiones;
  },

  getComunas: async (codigoRegion: string) => {
    return (regionesComunas.comunas as Record<string, { codigo: string; nombre: string }[]>)[codigoRegion] ?? [];
  },
};