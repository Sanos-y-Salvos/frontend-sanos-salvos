import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TicketCheck, Mail, Send, CheckCircle, Wrench,
  AlertTriangle, HelpCircle, ChevronRight, Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticketService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const CATEGORIAS = [
  { value: 'problema_tecnico', label: 'Problema técnico',  icon: Wrench,        desc: 'Errores, fallas o comportamiento inesperado de la plataforma.' },
  { value: 'reporte_abuso',   label: 'Reporte de abuso',   icon: AlertTriangle, desc: 'Usuarios o contenido que violan las normas de la comunidad.'   },
  { value: 'otro',            label: 'Otro',               icon: HelpCircle,    desc: 'Consultas generales, sugerencias u otras solicitudes.'          },
];

const NuevoTicketPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [email, setEmail]           = useState('');
  const [categoria, setCategoria]   = useState('');
  const [asunto, setAsunto]         = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [creado, setCreado]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (categoria === 'otro' && !asunto.trim()) { setError('El asunto es requerido para la categoría "Otro"'); return; }
    setLoading(true);
    try {
      if (isAuthenticated) {
        await ticketService.crearTicket({ categoria, asunto: asunto || undefined, descripcion });
      } else {
        if (!email.trim()) { setError('El correo es requerido'); setLoading(false); return; }
        await ticketService.crearTicketPublico({ email, categoria, asunto: asunto || undefined, descripcion });
      }
      setCreado(true);
    } catch {
      setError('Error al crear el ticket. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Éxito ── */
  if (creado) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Ticket creado</h2>
          <p className="text-slate-500 text-sm mb-7 leading-relaxed">
            Tu solicitud fue registrada. El equipo de soporte te responderá a la brevedad.
          </p>
          <div className="flex gap-3">
            {isAuthenticated && (
              <button
                onClick={() => navigate('/tickets')}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
              >
                Ver mis tickets
              </button>
            )}
            <button
              onClick={() => navigate('/soporte')}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium py-2.5 rounded-xl transition-all"
            >
              Ir al soporte
            </button>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );

  /* ── Formulario ── */
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-6 py-6">
          <BotonVolver ruta="/soporte" texto="Volver al soporte" />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
              <TicketCheck className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">Nuevo ticket</h1>
              <p className="text-xs text-slate-500">Cuéntanos tu problema y te ayudamos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-lg mx-auto space-y-4"
        >
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Alert variant="error">{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            {isAuthenticated ? (
              <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Correo de contacto</p>
                  <p className="text-sm font-medium text-slate-700">{user?.email}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <Input
                  label={<>Correo de contacto <span className="text-rose-400">*</span></>}
                  icon={<Mail className="w-4 h-4" />}
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.cl" required
                />
              </div>
            )}

            {/* Categoría */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-700 mb-3">
                Categoría <span className="text-rose-400">*</span>
              </p>
              <div className="space-y-2">
                {CATEGORIAS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setCategoria(value); if (value !== 'otro') setAsunto(''); }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                      categoria === value
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      categoria === value ? 'bg-brand-100' : 'bg-white border border-slate-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${categoria === value ? 'text-brand-600' : 'text-slate-400'}`} strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${categoria === value ? 'text-brand-700' : 'text-slate-700'}`}>{label}</p>
                      <p className="text-xs text-slate-400 truncate">{desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${categoria === value ? 'text-brand-400' : 'text-slate-200'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Asunto (solo para "otro") */}
            <AnimatePresence>
              {categoria === 'otro' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <Input
                      label={<>Asunto <span className="text-rose-400">*</span></>}
                      type="text" value={asunto}
                      onChange={(e) => setAsunto(e.target.value)}
                      placeholder="Resumen breve del problema"
                      required
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Descripción */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Descripción <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe el problema con el mayor detalle posible: ¿qué hiciste?, ¿qué esperabas que pasara?, ¿qué pasó realmente?"
                rows={5}
                required
                className="w-full border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !categoria || !descripcion.trim()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando ticket...</>
                : <><Send className="w-4 h-4" /> Enviar ticket</>
              }
            </button>
          </form>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default NuevoTicketPage;
