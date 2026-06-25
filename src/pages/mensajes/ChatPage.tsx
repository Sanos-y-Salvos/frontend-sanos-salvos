import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, AlertTriangle, ShieldAlert, Loader2, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMensajeria } from '../../context/MensajeriaContext';
import { cambiarEstadoSala, obtenerSala } from '../../services/mensajeriaService';
import { obtenerReporte, cambiarEstadoReporte } from '../../services/reporteService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Alert from '../../components/ui/Alert';
import type { Mensaje, Sala, Reporte } from '../../types';

const ROLES_MODERADOR = ['moderador', 'administrador', 'superadmin'];
type EstadoSala = 'ACTIVA' | 'CONGELADA' | 'CLAUSURADA';

const estadoBadge: Record<string, string> = {
  CONGELADA:  'bg-amber-100 text-amber-700',
  CLAUSURADA: 'bg-rose-100 text-rose-700',
};

const nombreDesdeEmail = (email: string) =>
  email ? email.split('@')[0].replace(/[._]/g, ' ') : 'Usuario';

const ChatPage = () => {
  const { salaId } = useParams<{ salaId: string }>();
  const { user }   = useAuth();
  const { socket } = useMensajeria();

  const [mensajes, setMensajes]         = useState<Mensaje[]>([]);
  const [estadoSala, setEstadoSala]     = useState<EstadoSala>('ACTIVA');
  const [input, setInput]               = useState('');
  const [error, setError]               = useState('');
  const [cargando, setCargando]         = useState(true);
  const [enviando, setEnviando]         = useState(false);

  // Datos para el panel de confirmación
  const [sala, setSala]                 = useState<Sala | null>(null);
  const [miReporte, setMiReporte]       = useState<Reporte | null>(null);
  const [accionCargando, setAccionCargando] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const esModerador = ROLES_MODERADOR.includes(user?.rol ?? '');

  // Cargar sala y reporte asociado al usuario actual
  useEffect(() => {
    if (!salaId || !user) return;
    obtenerSala(salaId).then(async (s) => {
      setSala(s);
      const reporteId = user.credential_id === s.usuarioAId ? s.reporteAId : s.reporteBId;
      try {
        const r = await obtenerReporte(reporteId);
        setMiReporte(r);
      } catch { /* si falla no bloquea el chat */ }
    }).catch(() => {});
  }, [salaId, user]);

  // Socket: historial + eventos
  useEffect(() => {
    if (!socket || !salaId) return;
    socket.emit('join_sala', { salaId });

    const onHistorial = ({ mensajes: hist, estado }: { mensajes: Mensaje[]; estado: EstadoSala }) => {
      setMensajes(hist);
      setEstadoSala(estado);
      setCargando(false);
    };
    const onMensajeNuevo  = (msg: Mensaje)                     => setMensajes((prev) => [...prev, msg]);
    const onSalaCongelada = ()                                  => setEstadoSala('CONGELADA');
    const onSalaClausura  = ()                                  => setEstadoSala('CLAUSURADA');
    const onError         = ({ message }: { message: string }) => setError(message);

    socket.on('historial',       onHistorial);
    socket.on('mensaje_nuevo',   onMensajeNuevo);
    socket.on('sala_congelada',  onSalaCongelada);
    socket.on('sala_clausurada', onSalaClausura);
    socket.on('error',           onError);

    return () => {
      socket.off('historial',       onHistorial);
      socket.off('mensaje_nuevo',   onMensajeNuevo);
      socket.off('sala_congelada',  onSalaCongelada);
      socket.off('sala_clausurada', onSalaClausura);
      socket.off('error',           onError);
    };
  }, [socket, salaId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviarMensaje = () => {
    if (!input.trim() || !socket) return;
    setEnviando(true);
    socket.emit('enviar_mensaje', { contenido: input.trim() });
    setInput('');
    setEnviando(false);
  };

  const reportarSala = () => {
    if (!socket || !salaId) return;
    if (!confirm('¿Reportar esta conversación? Quedará congelada hasta que un moderador la revise.')) return;
    socket.emit('reportar_sala', { salaId });
  };

  const cambiarEstadoSalaFn = async (estado: string) => {
    if (!salaId) return;
    try {
      const s = await cambiarEstadoSala(salaId, estado);
      setEstadoSala(s.estado);
    } catch {
      setError('No se pudo cambiar el estado de la sala.');
    }
  };

  const confirmarReporte = async (nuevoEstado: 'RESUELTO' | 'EN_BUSQUEDA') => {
    if (!miReporte) return;
    setAccionCargando(true);
    try {
      const actualizado = await cambiarEstadoReporte(miReporte.id, nuevoEstado);
      setMiReporte(actualizado);
    } catch {
      setError('No se pudo actualizar el estado del reporte.');
    } finally {
      setAccionCargando(false);
    }
  };

  const bloqueado = estadoSala !== 'ACTIVA';
  const mostrarPanel = miReporte?.estado === 'EMPAREJADO';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <BotonVolver ruta="/mensajes" texto="Mis conversaciones" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-slate-900">Conversación privada</h1>
                {estadoSala !== 'ACTIVA' && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoBadge[estadoSala]}`}>
                    {estadoSala}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {estadoSala === 'ACTIVA' && (
                <button
                  onClick={reportarSala}
                  title="Reportar conversación"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
              {esModerador && estadoSala === 'CONGELADA' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstadoSalaFn('ACTIVA')}
                    className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => cambiarEstadoSalaFn('CLAUSURADA')}
                    className="text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition-colors flex items-center gap-1 font-medium"
                  >
                    <ShieldAlert className="w-3 h-3" /> Clausurar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col py-4 px-4">
        <div className="max-w-2xl mx-auto w-full flex flex-col flex-1 gap-3">

          {error && <Alert variant="error">{error}</Alert>}

          {/* Panel de confirmación — aparece cuando el reporte está EMPAREJADO */}
          {mostrarPanel && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">¿Es tu mascota?</p>
              <p className="text-xs text-amber-600 mb-3">
                Conversa con la otra persona y luego confirma si se trata de tu mascota.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => confirmarReporte('RESUELTO')}
                  disabled={accionCargando}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium active:scale-[0.98]"
                >
                  {accionCargando
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Sí, la encontré
                </button>
                <button
                  onClick={() => confirmarReporte('EN_BUSQUEDA')}
                  disabled={accionCargando}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-medium active:scale-[0.98]"
                >
                  {accionCargando
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <XCircle className="w-3.5 h-3.5" />}
                  No es mi mascota
                </button>
              </div>
            </div>
          )}

          {/* Confirmación tras resolver */}
          {miReporte?.estado === 'RESUELTO' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-700 font-medium">¡Reporte marcado como resuelto!</p>
            </div>
          )}

          {/* Área de mensajes */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 overflow-y-auto min-h-[400px] max-h-[calc(100vh-380px)] flex flex-col gap-1">
            {cargando && (
              <div className="flex items-center justify-center flex-1 gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando mensajes...
              </div>
            )}

            {!cargando && mensajes.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-2 text-slate-400">
                <MessageCircle className="w-8 h-8 opacity-30" strokeWidth={1.5} />
                <p className="text-sm">Sé el primero en escribir.</p>
              </div>
            )}

            {mensajes.map((msg, i) => {
              const esMio = msg.autorId === user?.credential_id;
              const anterior = mensajes[i - 1];
              const mostrarNombre = !anterior || anterior.autorId !== msg.autorId;
              const nombre = esMio ? 'Tú' : nombreDesdeEmail(msg.emailAutor);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${esMio ? 'items-end' : 'items-start'} ${i > 0 && anterior.autorId === msg.autorId ? 'mt-0.5' : 'mt-3'}`}
                >
                  {mostrarNombre && (
                    <span className={`text-[11px] font-semibold mb-1 px-1 ${esMio ? 'text-slate-500' : 'text-brand-600'}`}>
                      {nombre}
                    </span>
                  )}
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    esMio
                      ? 'bg-slate-900 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.contenido}</p>
                    <p className="text-[10px] mt-1 opacity-50">
                      {new Date(msg.creadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {estadoSala === 'CLAUSURADA' ? (
            <div className="text-center text-sm text-rose-500 py-3 bg-rose-50 rounded-2xl border border-rose-100">
              Esta conversación fue clausurada por un moderador.
            </div>
          ) : (
            <div className={bloqueado ? 'opacity-50 pointer-events-none' : ''}>
              {estadoSala === 'CONGELADA' && (
                <p className="text-xs text-amber-600 mb-2 text-center">
                  La conversación está congelada. Un moderador la está revisando.
                </p>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && enviarMensaje()}
                  placeholder="Escribe un mensaje..."
                  disabled={bloqueado}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all bg-white disabled:bg-slate-50"
                />
                <button
                  onClick={enviarMensaje}
                  disabled={bloqueado || enviando || !input.trim()}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChatPage;
