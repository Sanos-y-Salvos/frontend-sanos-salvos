import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, ChevronRight, MessageSquare, Wrench,
  AlertTriangle, HelpCircle, Loader2, Lock, Send, ShieldCheck, User,
  TicketCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticketService';
import type { Ticket } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Alert from '../../components/ui/Alert';

/* ── helpers ── */
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
const CatIcon = ({ cat }: { cat: string }) => {
  const cls = 'w-3.5 h-3.5';
  if (cat === 'problema_tecnico') return <Wrench className={cls} strokeWidth={1.5} />;
  if (cat === 'reporte_abuso')    return <AlertTriangle className={cls} strokeWidth={1.5} />;
  return <HelpCircle className={cls} strokeWidth={1.5} />;
};

/* ── Vista de detalle ── */
const DetalleTicket = ({
  ticket, onVolver, onActualizar,
}: { ticket: Ticket; onVolver: () => void; onActualizar: (t: Ticket) => void }) => {
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando]     = useState(false);
  const [error, setError]           = useState('');

  const handleEnviar = async () => {
    if (!comentario.trim()) return;
    setEnviando(true); setError('');
    try {
      await ticketService.agregarComentario(ticket.id, comentario);
      const actualizado = await ticketService.verTicket(ticket.id);
      onActualizar(actualizado);
      setComentario('');
    } catch {
      setError('Error al enviar el comentario');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <BotonVolver onClick={onVolver} texto="Volver a mis tickets" />
          <div className="flex items-start justify-between mt-3 gap-3">
            <h1 className="text-xl font-display font-bold text-slate-900 leading-snug">{ticket.asunto}</h1>
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

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Descripción */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Descripción</p>
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.descripcion}</p>
          </div>

          {/* Conversación */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-slate-400" />
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
                    <div key={c.id} className={`rounded-xl p-4 text-sm ${
                      esAdmin ? 'bg-brand-50 border border-brand-100' : 'bg-slate-50 border border-slate-100'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${esAdmin ? 'text-brand-700' : 'text-slate-500'}`}>
                          {esAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          {esAdmin ? 'Soporte' : 'Tú'}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.contenido}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {ticket.estado !== 'cerrado' ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {error && <Alert variant="error">{error}</Alert>}
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agrega información adicional..."
                  rows={3}
                  className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all resize-none"
                />
                <button
                  onClick={handleEnviar}
                  disabled={enviando || !comentario.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {enviando ? 'Enviando...' : 'Agregar comentario'}
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
      <Footer />
    </div>
  );
};

/* ── Página principal ── */
const TicketsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: loadingAuth } = useAuth();
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [seleccionado, setSeleccionado] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    ticketService.misTickets()
      .then(setTickets)
      .catch(() => setError('Error al cargar los tickets'))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

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
      onVolver={() => setSeleccionado(null)}
      onActualizar={setSeleccionado}
    />
  );

  /* No autenticado */
  if (!loadingAuth && !isAuthenticated) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-slate-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mb-2">Inicia sesión para ver tus tickets</h2>
          <p className="text-sm text-slate-500 mb-7">Necesitas una cuenta para gestionar solicitudes de soporte.</p>
          <div className="flex gap-3">
            <Link to="/login" className="flex-1 flex items-center justify-center text-sm font-medium bg-slate-900 text-white py-2.5 rounded-xl hover:bg-slate-800 transition text-center">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="flex-1 flex items-center justify-center text-sm font-medium border border-slate-200 text-slate-700 py-2.5 rounded-xl hover:bg-slate-50 transition text-center">
              Registrarse
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <BotonVolver ruta="/soporte" texto="Volver al soporte" />
            <div className="flex items-center gap-2.5 mt-3">
              <ClipboardList className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              <h1 className="text-xl font-display font-bold text-slate-900">Mis tickets</h1>
            </div>
          </div>
          <button
            onClick={() => navigate('/tickets/nuevo')}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      </div>

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">

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
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-14 text-center"
            >
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TicketCheck className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
              </div>
              <h2 className="font-display font-bold text-slate-800 mb-1">No tienes tickets aún</h2>
              <p className="text-sm text-slate-400 mb-6">¿Tienes algún problema? Crea un ticket de soporte.</p>
              <button
                onClick={() => navigate('/tickets/nuevo')}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                Crear primer ticket
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket, i) => (
                <motion.button
                  key={ticket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
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

                  {ticket.comentarios?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-brand-600 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {ticket.comentarios.length} comentario{ticket.comentarios.length > 1 ? 's' : ''}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TicketsPage;
