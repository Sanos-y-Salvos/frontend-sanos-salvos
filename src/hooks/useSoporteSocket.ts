import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { storage } from '../utils/storage';
import type { Comentario } from '../types';

const SOPORTE_URL = import.meta.env.VITE_MS_SOPORTE_URL || 'http://localhost:3005';

export function useSoporteSocket(
  ticketId: string | null,
  onComentario: (c: Comentario) => void,
) {
  const callbackRef = useRef(onComentario);
  callbackRef.current = onComentario;

  useEffect(() => {
    if (!ticketId) return;
    const token = storage.getAccessToken();
    if (!token) return;

    const socket = io(SOPORTE_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.emit('join_ticket', ticketId);
    socket.on('comentario_recibido', (c: Comentario) => callbackRef.current(c));

    return () => {
      socket.emit('leave_ticket', ticketId);
      socket.disconnect();
    };
  }, [ticketId]);
}
