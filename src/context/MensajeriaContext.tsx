import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../utils/storage';

const MENSAJERIA_URL = import.meta.env.VITE_MS_MENSAJERIA_URL ?? 'http://localhost:3006';

interface MensajeriaContextType {
  socket: Socket | null;
  connected: boolean;
  notificaciones: number;
  clearNotificaciones: () => void;
}

const MensajeriaContext = createContext<MensajeriaContextType>({
  socket: null,
  connected: false,
  notificaciones: 0,
  clearNotificaciones: () => {},
});

export const MensajeriaProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notificaciones, setNotificaciones] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket((prev) => { prev?.disconnect(); return null; });
      setConnected(false);
      return;
    }

    const token = storage.getAccessToken();
    const s = io(MENSAJERIA_URL || undefined, {
      auth: { token },
      transports: ['websocket'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('sala_creada', () => setNotificaciones((n) => n + 1));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [isAuthenticated]);

  const clearNotificaciones = () => setNotificaciones(0);

  return (
    <MensajeriaContext.Provider value={{ socket, connected, notificaciones, clearNotificaciones }}>
      {children}
    </MensajeriaContext.Provider>
  );
};

export const useMensajeria = () => useContext(MensajeriaContext);
