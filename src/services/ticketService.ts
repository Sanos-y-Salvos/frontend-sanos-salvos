import { soporteApi } from './api';
import type { Ticket } from '../types';

export const ticketService = {
  crearTicket: async (datos: {
    categoria: string;
    asunto?: string;
    descripcion: string;
  }): Promise<Ticket> => {
    const { data } = await soporteApi.post('/api/tickets', datos);
    return data.data;
  },

  misTickets: async (): Promise<Ticket[]> => {
    const { data } = await soporteApi.get('/api/tickets/mis-tickets');
    return data.data;
  },

  verTicket: async (id: string): Promise<Ticket> => {
    const { data } = await soporteApi.get(`/api/tickets/${id}`);
    return data.data;
  },

  agregarComentario: async (ticketId: string, contenido: string) => {
    const { data } = await soporteApi.post(`/api/tickets/${ticketId}/comentarios`, { contenido });
    return data.data;
  },

  listarTickets: async (estado?: string): Promise<Ticket[]> => {
    const params = estado ? `?estado=${estado}` : '';
    const { data } = await soporteApi.get(`/api/tickets${params}`);
    return data.data;
  },

  asignarTicket: async (ticketId: string): Promise<Ticket> => {
    const { data } = await soporteApi.patch(`/api/tickets/${ticketId}/asignar`);
    return data.data;
  },

  responderTicket: async (ticketId: string, contenido: string): Promise<Ticket> => {
    const { data } = await soporteApi.post(`/api/tickets/${ticketId}/responder`, { contenido });
    return data.data;
  },

  actualizarEstado: async (ticketId: string, estado: string): Promise<Ticket> => {
    const { data } = await soporteApi.patch(`/api/tickets/${ticketId}/estado`, { estado });
    return data.data;
  },

  crearTicketPublico: async (datos: { email: string; categoria: string; asunto?: string; descripcion: string }): Promise<Ticket> => {
    const { data } = await soporteApi.post('/api/tickets/publico', datos);
    return data.data;
  },

  preguntarChatbot: async (pregunta: string): Promise<string> => {
    const { data } = await soporteApi.post('/api/chatbot/preguntar', { pregunta });
    return data.data.respuesta;
  },

  getEstadisticas: async (): Promise<{
    total: number;
    por_estado: { estado: string; count: number }[];
    por_categoria: { categoria: string; count: number }[];
    por_mes: { mes: string; count: number }[];
    por_mes_categoria: { mes: string; categoria: string; count: number }[];
    tiempo_resolucion: { categoria: string; dias_promedio: number }[];
  }> => {
    const { data } = await soporteApi.get('/api/tickets/estadisticas');
    return data.data;
  },
};