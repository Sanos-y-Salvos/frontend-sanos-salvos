import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Send, AlertTriangle, Loader2, MessageCircle, CheckCircle2, XCircle, RotateCcw, Ban, ImageIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useMensajeria } from '../../context/MensajeriaContext';
import { cambiarEstadoSala, obtenerSala, uploadImagenMensaje, MENSAJERIA_URL } from '../../services/mensajeriaService';
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

  // Modal de reporte
  const [mostrarModalReporte, setMostrarModalReporte] = useState(false);
  const [motivoReporte, setMotivoReporte]             = useState('');
  const [reportando, setReportando]                   = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
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

  const handleImagenSeleccionada = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !socket) return;
    setSubiendoImagen(true);
    try {
      const url = await uploadImagenMensaje(file);
      socket.emit('enviar_mensaje', { imagenUrl: url });
    } catch {
      setError('No se pudo subir la imagen. Máximo 10 MB.');
    } finally {
      setSubiendoImagen(false);
    }
  }, [socket]);

  const reportarSala = () => {
    setMotivoReporte('');
    setMostrarModalReporte(true);
  };

  const enviarReporte = () => {
    if (!socket || !salaId || !motivoReporte.trim()) return;
    setReportando(true);
    socket.emit('reportar_sala', { salaId, motivo: motivoReporte.trim() });
    setMostrarModalReporte(false);
    setMotivoReporte('');
    setReportando(false);
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
  const mostrarPanel = !esModerador && miReporte?.tipo === 'PERDIDA' && miReporte?.estado === 'EMPAREJADO';

  const contenedorCls = esModerador
    ? 'px-6 lg:px-8'
    : 'max-w-2xl mx-auto px-5';

  return (
    <div className={`min-h-screen flex flex-col ${esModerador ? 'admin-glass' : 'public-glass'}`}>
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className={`${contenedorCls} py-4`}>
          {esModerador
            ? <BotonVolver ruta="/admin/mensajes" texto="Gestión de conversaciones" />
            : <BotonVolver ruta="/mensajes" texto="Mis conversaciones" />}
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
              {!esModerador && estadoSala === 'ACTIVA' && (
                <button
                  onClick={reportarSala}
                  title="Reportar conversación"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
              )}
              {esModerador && (estadoSala === 'CONGELADA' || estadoSala === 'CLAUSURADA') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstadoSalaFn('ACTIVA')}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors font-medium cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Restaurar
                  </button>
                  {estadoSala === 'CONGELADA' && (
                    <button
                      onClick={() => cambiarEstadoSalaFn('CLAUSURADA')}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 transition-colors font-medium cursor-pointer"
                    >
                      <Ban className="w-3 h-3" /> Clausurar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col py-4 px-4">
        <div className={`${esModerador ? 'max-w-4xl mx-auto' : 'max-w-2xl mx-auto'} w-full flex flex-col flex-1 gap-3`}>

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
              const esSistema = msg.autorId === 'sistema';
              const esMio     = !esSistema && msg.autorId === user?.credential_id;
              const anterior  = mensajes[i - 1];
              const mostrarNombre = !anterior || anterior.autorId !== msg.autorId;
              const nombre = esMio ? 'Tú' : nombreDesdeEmail(msg.emailAutor);

              // Mensaje de sistema — centrado con estilo especial
              if (esSistema) return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 max-w-[85%] text-center">
                    <div className="shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-0.5">Soporte</p>
                      <p className="text-xs text-emerald-700 leading-relaxed">{msg.contenido}</p>
                      <p className="text-[10px] text-emerald-500 mt-1">
                        {new Date(msg.creadoEn).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              );

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
                  <div className={`max-w-[75%] rounded-2xl text-sm overflow-hidden ${
                    esMio
                      ? 'bg-slate-900 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.imagenUrl && (
                      <img
                        src={`${MENSAJERIA_URL}${msg.imagenUrl}`}
                        alt="imagen"
                        className="max-w-full max-h-64 object-cover cursor-pointer block"
                        onClick={() => window.open(`${MENSAJERIA_URL}${msg.imagenUrl}`, '_blank')}
                      />
                    )}
                    {msg.contenido && (
                      <div className="px-4 py-2.5">
                        <p className="leading-relaxed">{msg.contenido}</p>
                      </div>
                    )}
                    <p className={`text-[10px] opacity-50 pb-1.5 ${msg.contenido ? 'px-4 -mt-1' : 'px-3 pt-1'}`}>
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagenSeleccionada}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={bloqueado || subiendoImagen}
                  title="Enviar imagen"
                  className="px-3 py-2.5 border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {subiendoImagen
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <ImageIcon className="w-4 h-4" />}
                </button>
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
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <Footer />

      {/* Modal de reporte */}
      {mostrarModalReporte && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMostrarModalReporte(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">Reportar conversación</h2>
                <p className="text-xs text-slate-500 mt-0.5">La sala quedará congelada hasta que un moderador la revise.</p>
              </div>
            </div>

            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Motivo del reporte <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motivoReporte}
              onChange={e => setMotivoReporte(e.target.value)}
              placeholder="Describe por qué estás reportando esta conversación..."
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all resize-none"
            />
            {motivoReporte.trim().length === 0 && (
              <p className="text-xs text-rose-500 mt-1">El motivo es obligatorio.</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setMostrarModalReporte(false)}
                className="flex-1 py-2.5 text-sm font-medium border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={enviarReporte}
                disabled={reportando || !motivoReporte.trim()}
                className="flex-1 py-2.5 text-sm font-medium bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {reportando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
