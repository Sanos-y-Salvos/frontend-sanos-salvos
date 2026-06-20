import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, ChevronRight, MessageSquare, Filter, Loader2,
  Wrench, AlertTriangle, HelpCircle, ShieldCheck, User, Send,
  UserCheck, RefreshCw, TicketCheck, Mail,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import type { Ticket } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Alert from '../../components/ui/Alert';

/* ── helpers ─────────────────────────────────────────────────────────── */
const estadoBadge: Record<string, string> = {
  abierto:    'bg-brand-100 text-brand-700 border border-brand-200',
  en_proceso: 'bg-amber-100 text-amber-700 border border-amber-200',
  resuelto:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  cerrado:    'bg-slate-100 text-slate-500 border border-slate-200',
};
const estadoLabel: Record<string, string> = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};
const categoriaLabel: Record<string, string> = {
  problema_tecnico: 'Problema técnico', reporte_abuso: 'Reporte de abuso', otro: 'Otro',
};
const FILTROS = ['', 'abierto', 'en_proceso', 'resuelto', 'cerrado'];

const CatIcon = ({ cat }: { cat: string }) => {
  const cls = 'w-3.5 h-3.5';
  if (cat === 'problema_tecnico') return <Wrench className={cls} strokeWidth={1.5} />;
  if (cat === 'reporte_abuso')    return <AlertTriangle className={cls} strokeWidth={1.5} />;
  return <HelpCircle className={cls} strokeWidth={1.5} />;
};

const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all';

/* ── Vista detalle ────────────────────────────────────────────────────── */
const DetalleTicket = ({
  ticket,
  onVolver,
  onActualizar,
}: {
  ticket: Ticket;
  onVolver: () => void;
  onActualizar: (t: Ticket) => void;
}) => {
  const [respuesta, setRespuesta]   = useState('');
  const [enviando, setEnviando]     = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState(ticket.estado);
  const [error, setError]           = useState('');

  const handleAsignar = async () => {
    setEnviando(true); setError('');
    try {
      const actualizado = await ticketService.asignarTicket(ticket.id);
      onActualizar(actualizado);
    } catch {
      setError('Error al asignar el ticket');
    } finally {
      setEnviando(false);
    }
  };

  const handleActualizarEstado = async () => {
    if (!nuevoEstado || nuevoEstado === ticket.estado) return;
    setEnviando(true); setError('');
    try {
      const actualizado = await ticketService.actualizarEstado(ticket.id, nuevoEstado);
      onActualizar(actualizado);
    } catch {
      setError('Error al actualizar el estado');
    } finally {
      setEnviando(false);
    }
  };

  const handleResponder = async () => {
    if (!respuesta.trim()) return;
    setEnviando(true); setError('');
    try {
      await ticketService.responderTicket(ticket.id, respuesta);
      const actualizado = await ticketService.verTicket(ticket.id);
      onActualizar(actualizado);
      setRespuesta('');
    } catch {
      setError('Error al responder el ticket');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-5">
          <BotonVolver onClick={onVolver} texto="Volver a tickets" />
          <div className="flex items-start justify-between mt-3 gap-3">
            <h1 className="text-xl font-display font-bold text-slate-900 leading-snug">
              {ticket.asunto}
            </h1>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${estadoBadge[ticket.estado]}`}>
              {estadoLabel[ticket.estado]}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <CatIcon cat={ticket.categoria} />
            {categoriaLabel[ticket.categoria]} · {new Date(ticket.created_at).toLocaleDateString('es-CL')}
          </p>
        </div>
      </div>

      <div className="flex-1 py-6 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start mt-4">
            <div className="space-y-4">
              {/* Info */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Información
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">
                <span className="font-medium text-slate-800">
                  {ticket.user_id ? 'Usuario ID:' : 'Email contacto:'}
                </span>{' '}
                <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded-md">
                  {ticket.user_id ?? ticket.email_contacto ?? '—'}
                </span>
              </p>
              {ticket.asignado_a && (
                <p className="text-slate-600">
                  <span className="font-medium text-slate-800">Asignado a:</span>{' '}
                  <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded-md">
                    {ticket.asignado_a}
                  </span>
                </p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Descripción
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{ticket.descripcion}</p>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <h2 className="font-semibold text-slate-800 text-sm">Acciones</h2>
            </div>
            <div className="space-y-3">
              {ticket.estado === 'abierto' && (
                <button
                  onClick={handleAsignar}
                  disabled={enviando}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Tomar ticket
                </button>
              )}
              <div className="flex gap-2">
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value)}
                  className={`flex-1 ${selectCls}`}
                >
                  {FILTROS.filter(Boolean).map((e) => (
                    <option key={e} value={e}>{estadoLabel[e]}</option>
                  ))}
                </select>
                <button
                  onClick={handleActualizarEstado}
                  disabled={enviando || nuevoEstado === ticket.estado}
                  className="px-4 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-40"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>
            </div>
            <div>
              {/* Conversación */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <h2 className="font-semibold text-slate-800 text-sm">Conversación</h2>
            </div>

            {ticket.comentarios.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" strokeWidth={1} />
                <p className="text-sm">No hay comentarios aún</p>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                {ticket.comentarios.map((c) => {
                  const esAdmin = c.tipo_autor === 'administrador';
                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl p-4 text-sm ${
                        esAdmin
                          ? 'bg-brand-50 border border-brand-100'
                          : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${esAdmin ? 'text-brand-700' : 'text-slate-500'}`}>
                          {esAdmin
                            ? <ShieldCheck className="w-3.5 h-3.5" />
                            : <User className="w-3.5 h-3.5" />}
                          {esAdmin ? 'Soporte' : 'Usuario'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(c.created_at).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.contenido}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {ticket.estado !== 'cerrado' ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {!ticket.user_id && ticket.email_contacto && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <Mail className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>
                      Usuario no registrado. Tu respuesta se enviará al correo{' '}
                      <strong>{ticket.email_contacto}</strong>.
                    </span>
                  </div>
                )}
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="Escribe tu respuesta al usuario..."
                  rows={3}
                  className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all resize-none"
                />
                <button
                  onClick={handleResponder}
                  disabled={enviando || !respuesta.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {enviando
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {enviando ? 'Enviando...' : 'Responder'}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center pt-3 border-t border-slate-100">
                Este ticket está cerrado y no acepta más comentarios.
              </p>
            )}
          </div>

              </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

/* ── Página principal ─────────────────────────────────────────────────── */
const AdminTicketsPage = () => {
  const [tickets, setTickets]             = useState<Ticket[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [filtroEstado, setFiltroEstado]   = useState('');
  const [seleccionado, setSeleccionado]   = useState<Ticket | null>(null);

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.listarTickets(filtroEstado || undefined);
      setTickets(data);
    } catch {
      setError('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarTickets(); }, [filtroEstado]);

  const handleVerTicket = async (id: string) => {
    try {
      setSeleccionado(await ticketService.verTicket(id));
    } catch {
      setError('Error al cargar el ticket');
    }
  };

  if (seleccionado) return (
    <DetalleTicket
      ticket={seleccionado}
      onVolver={() => { setSeleccionado(null); cargarTickets(); }}
      onActualizar={setSeleccionado}
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-6">
          <BotonVolver ruta="/admin" texto="Panel de control" />
          <div className="flex items-center gap-2.5 mt-3">
            <ClipboardList className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-slate-900">Gestión de Tickets</h1>
          </div>
          {!loading && (
            <p className="text-slate-500 text-sm mt-0.5 ml-7">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} encontrado{tickets.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="px-6 lg:px-8 pb-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-medium">Estado:</span>
          </div>
          {FILTROS.map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filtroEstado === estado
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {estado === '' ? 'Todos' : estadoLabel[estado]}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <main className="flex-1 py-6 px-6 lg:px-8">
        <div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
                <Alert variant="error">{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
              <p className="text-sm">Cargando tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TicketCheck className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
              </div>
              <h2 className="font-display font-bold text-slate-800 mb-1">No hay tickets</h2>
              <p className="text-sm text-slate-400">No se encontraron tickets con ese filtro.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {tickets.map((ticket, i) => (
                <motion.button
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleVerTicket(ticket.id)}
                  className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-5 text-left transition-all duration-200 group active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">{ticket.asunto}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoBadge[ticket.estado]}`}>
                        {estadoLabel[ticket.estado]}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                    <CatIcon cat={ticket.categoria} />
                    {categoriaLabel[ticket.categoria]} · {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                  </p>

                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{ticket.descripcion}</p>

                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-slate-400 font-mono">
                      {ticket.user_id
                        ? ticket.user_id.slice(0, 8) + '...'
                        : ticket.email_contacto ?? '—'}
                    </p>
                    {ticket.comentarios?.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {ticket.comentarios.length} comentario{ticket.comentarios.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminTicketsPage;
