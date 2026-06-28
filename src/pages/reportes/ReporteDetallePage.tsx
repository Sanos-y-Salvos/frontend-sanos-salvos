import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PawPrint, MapPin, Calendar, Cpu, AlertCircle, Loader2, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { obtenerReporte, cambiarEstadoReporte } from '../../services/reporteService';
import { listarMatchesPorReporte } from '../../services/matchingService';
import { useAuth } from '../../hooks/useAuth';
import type { Reporte, Match } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';

const MS_MASCOTAS_URL = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003';

const tipoBadge = (tipo: string) =>
  tipo === 'PERDIDA'
    ? 'bg-rose-100 text-rose-700 border border-rose-200'
    : 'bg-emerald-100 text-emerald-700 border border-emerald-200';

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    EN_BUSQUEDA: 'bg-blue-100 text-blue-700',
    EMPAREJADO:  'bg-amber-100 text-amber-700',
    RESUELTO:    'bg-emerald-100 text-emerald-700',
    ABANDONADO:  'bg-slate-100 text-slate-500',
    OCULTO:      'bg-slate-100 text-slate-500',
  };
  return map[estado] ?? 'bg-slate-100 text-slate-500';
};

const estadoLabel: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda',
  EMPAREJADO:  'Emparejado',
  RESUELTO:    'Resuelto',
  ABANDONADO:  'Abandonado',
  OCULTO:      'Oculto',
};

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-medium text-slate-700">{value ?? '—'}</p>
  </div>
);

const ReporteDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [accionCargando, setAccionCargando] = useState(false);

  useEffect(() => {
    if (!id) return;
    obtenerReporte(id)
      .then((r) => {
        setReporte(r);
        if (r.usuarioId === user?.credential_id) {
          listarMatchesPorReporte(id).then(setMatches).catch(() => {});
        }
      })
      .catch(() => setError('No se pudo cargar el reporte. Es posible que no exista o ya no esté disponible.'))
      .finally(() => setCargando(false));
  }, [id, user?.id]);

  if (cargando) return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        <span className="text-sm">Cargando reporte...</span>
      </div>
      <Footer />
    </div>
  );

  if (error || !reporte) return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-rose-500">
        <AlertCircle className="w-8 h-8" />
        <p className="text-sm">{error || 'Reporte no encontrado'}</p>
      </div>
      <Footer />
    </div>
  );

  const esOwner = reporte.usuarioId === user?.credential_id;

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!reporte) return;
    setAccionCargando(true);
    try {
      const actualizado = await cambiarEstadoReporte(reporte.id, nuevoEstado);
      setReporte(actualizado);
    } catch {
      setError('No se pudo actualizar el estado del reporte.');
    } finally {
      setAccionCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />

      {/* Page header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-5 py-4">
          <BotonVolver ruta="/reportes" texto="Volver a reportes" />
          <div className="flex items-start justify-between mt-3 gap-3">
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">{reporte.nombreMascota}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{reporte.especie} · {reporte.color} · {reporte.tamanio}</p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0 justify-end">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tipoBadge(reporte.tipo)}`}>
                {reporte.tipo}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estadoBadge(reporte.estado)}`}>
                {estadoLabel[reporte.estado] ?? reporte.estado}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Foto */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="h-72 bg-slate-100 flex items-center justify-center">
              {reporte.fotos.length > 0 ? (
                <img
                  src={`${MS_MASCOTAS_URL}${reporte.fotos[0].urlRelativa}`}
                  alt={reporte.nombreMascota}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-300">
                  <PawPrint className="w-12 h-12" strokeWidth={1} />
                  <span className="text-xs">Sin foto disponible</span>
                </div>
              )}
            </div>
            {reporte.fotos.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto bg-slate-50 border-t border-slate-100">
                {reporte.fotos.map((foto) => (
                  <img
                    key={foto.id}
                    src={`${MS_MASCOTAS_URL}${foto.urlRelativa}`}
                    alt={reporte.nombreMascota}
                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Información */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Especie"  value={reporte.especie} />
              <Field label="Tamaño"   value={reporte.tamanio} />
              <Field label="Color"    value={reporte.color} />
              <Field label="Estado"   value={estadoLabel[reporte.estado] ?? reporte.estado} />
              {reporte.codigoChip && (
                <div className="col-span-2">
                  <Field label="Código de chip" value={reporte.codigoChip} />
                </div>
              )}
            </div>

            {reporte.descripcion && (
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{reporte.descripcion}</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              {reporte.direccionReferencia && (
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <span>{reporte.direccionReferencia}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Publicado el{' '}
                  {new Date(reporte.fechaPublicacion).toLocaleDateString('es-CL', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones para estado EMPAREJADO — solo al dueño */}
          {esOwner && reporte.estado === 'EMPAREJADO' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">¡Se encontró una posible coincidencia!</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    El sistema emparejó este reporte con otro. Conversa con la otra persona y confirma si es tu mascota.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/mensajes')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium active:scale-[0.98]"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ir al chat
                </button>
                <button
                  onClick={() => cambiarEstado('RESUELTO')}
                  disabled={accionCargando}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all font-medium active:scale-[0.98]"
                >
                  {accionCargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar encontrada
                </button>
                <button
                  onClick={() => cambiarEstado('EN_BUSQUEDA')}
                  disabled={accionCargando}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all font-medium active:scale-[0.98]"
                >
                  {accionCargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  No es mi mascota
                </button>
              </div>
            </div>
          )}

          {/* Matches — solo al dueño del reporte */}
          {esOwner && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-0.5 h-4 bg-brand-500 rounded-full" />
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Posibles coincidencias ({matches.length})
                </h2>
              </div>

              {matches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center gap-2 text-slate-400">
                  <PawPrint className="w-8 h-8" strokeWidth={1.5} />
                  <p className="text-sm text-center">El sistema aún no encontró coincidencias para este reporte.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {matches.map((match) => {
                    const otroReporteId = match.reporte_a_id === id ? match.reporte_b_id : match.reporte_a_id;
                    const pct = Math.round(match.score * 100);
                    return (
                      <li key={match.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                {match.estado}
                              </span>
                              {match.auto_confirmado && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  <Cpu className="w-3 h-3" /> Chip coincidente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate max-w-[180px]">{otroReporteId}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                            <p className="text-xs text-slate-400">similitud</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-3 border-t border-slate-50">
                          <button
                            onClick={() => navigate(`/reportes/${otroReporteId}`)}
                            className="flex-1 text-xs py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
                          >
                            Ver reporte
                          </button>
                          <button
                            onClick={() => navigate('/mensajes')}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-[0.98] font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Ir a conversación
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ReporteDetallePage;
