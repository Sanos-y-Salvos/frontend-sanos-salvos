import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { listarSalas } from '../../services/mensajeriaService';
import { useMensajeria } from '../../context/MensajeriaContext';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import type { Sala } from '../../types';

const estadoBadge: Record<string, string> = {
  ACTIVA:     'bg-emerald-100 text-emerald-700',
  CONGELADA:  'bg-amber-100 text-amber-700',
  CLAUSURADA: 'bg-rose-100 text-rose-700',
};

const SalasPage = () => {
  const navigate = useNavigate();
  const { clearNotificaciones } = useMensajeria();
  const [salas, setSalas]       = useState<Sala[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    clearNotificaciones();
    listarSalas()
      .then(setSalas)
      .catch(() => setError('No se pudieron cargar las conversaciones.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <span className="text-sm">Cargando conversaciones...</span>
      </div>
      <Footer />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error}</p>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-5 py-6">
          <h1 className="text-xl font-display font-bold text-slate-900">Mis conversaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {salas.length} conversación{salas.length !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {salas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600">Sin conversaciones aún</p>
                <p className="text-xs mt-1 text-slate-400">
                  Se crean automáticamente cuando el sistema encuentra una coincidencia entre reportes.
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {salas.map((sala) => (
                <li key={sala.id}>
                  <button
                    onClick={() => navigate(`/mensajes/${sala.id}`)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                        <MessageCircle className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-800">Conversación privada</p>
                        <p className="text-xs text-slate-400">
                          {new Date(sala.creadoEn).toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoBadge[sala.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                        {sala.estado}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SalasPage;
