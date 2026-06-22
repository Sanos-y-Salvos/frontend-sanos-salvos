import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, ShieldAlert, RotateCcw, Loader2, AlertCircle,
  Clock, User, ExternalLink,
} from 'lucide-react';
import { listarSalasReportadas, cambiarEstadoSala, type SalaReportada } from '../../services/mensajeriaService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Alert from '../../components/ui/Alert';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function AdminMensajesPage() {
  const navigate = useNavigate();
  const [reportadas, setReportadas] = useState<SalaReportada[]>([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [accion, setAccion]         = useState<Record<string, boolean>>({});

  useEffect(() => {
    listarSalasReportadas()
      .then(setReportadas)
      .catch(() => setError('No se pudieron cargar las conversaciones reportadas.'))
      .finally(() => setCargando(false));
  }, []);

  const actuarSala = async (salaId: string, estado: 'ACTIVA' | 'CLAUSURADA') => {
    setAccion((prev) => ({ ...prev, [salaId]: true }));
    try {
      await cambiarEstadoSala(salaId, estado);
      setReportadas((prev) => prev.filter((r) => r.sala.id !== salaId));
    } catch {
      setError('No se pudo cambiar el estado de la conversación.');
    } finally {
      setAccion((prev) => ({ ...prev, [salaId]: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">Conversaciones reportadas</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {cargando ? 'Cargando…' : `${reportadas.length} conversación${reportadas.length !== 1 ? 'es' : ''} pendiente${reportadas.length !== 1 ? 's' : ''} de revisión`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8">
        {error && <Alert variant="error">{error}</Alert>}

        {cargando ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : reportadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-sm">No hay conversaciones reportadas pendientes.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reportadas.map(({ sala, denuncias }) => (
              <div key={sala.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* Header sala */}
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        Conversación <span className="font-mono text-xs text-slate-400">{sala.id.slice(0, 8)}…</span>
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {fmt(sala.actualizadoEn)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 shrink-0">
                    CONGELADA
                  </span>
                </div>

                {/* Denuncias */}
                <div className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    {denuncias.length} denuncia{denuncias.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {denuncias.map((d) => (
                      <div key={d.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                        <div className="w-6 h-6 bg-slate-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-mono text-slate-500 truncate">{d.reportadoPor}</p>
                          {d.motivo ? (
                            <p className="text-sm text-slate-700 mt-0.5">{d.motivo}</p>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-0.5">Sin motivo especificado</p>
                          )}
                          <p className="text-[11px] text-slate-400 mt-1">{fmt(d.creadoEn)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => navigate(`/mensajes/${sala.id}`)}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-white transition-colors font-medium"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver conversación
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => actuarSala(sala.id, 'ACTIVA')}
                    disabled={accion[sala.id]}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    {accion[sala.id]
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <RotateCcw className="w-3.5 h-3.5" />}
                    Restaurar
                  </button>
                  <button
                    onClick={() => actuarSala(sala.id, 'CLAUSURADA')}
                    disabled={accion[sala.id]}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 disabled:opacity-50 transition-colors font-medium"
                  >
                    {accion[sala.id]
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <ShieldAlert className="w-3.5 h-3.5" />}
                    Clausurar
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
