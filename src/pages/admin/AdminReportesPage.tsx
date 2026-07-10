import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronLeft, ChevronRight, ChevronRight as ArrowRight,
  Loader2, Search, MapPin, Check, Filter, Zap,
} from 'lucide-react';
import { listarReportes, obtenerReporte, cambiarEstadoReporte } from '../../services/reporteService';
import { userService } from '../../services/userService';
import { listarMatchesPorReporte } from '../../services/matchingService';
import type { Reporte, User, Match } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Alert from '../../components/ui/Alert';

/* ── constants ────────────────────────────────────────────────────────── */
const IMG_BASE = import.meta.env.VITE_MS_MASCOTAS_URL ?? 'http://localhost:3003';

const TIPO_BADGE: Record<string, string> = {
  PERDIDA:    'bg-rose-100 text-rose-700 border border-rose-200',
  ENCONTRADA: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};
const TIPO_LABELS: Record<string, string> = { PERDIDA: 'Perdida', ENCONTRADA: 'Encontrada' };

const ESTADO_BADGE: Record<string, string> = {
  EN_BUSQUEDA: 'bg-amber-100 text-amber-700 border border-amber-200',
  RESUELTO:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  ABANDONADO:  'bg-slate-100 text-slate-500 border border-slate-200',
  OCULTO:      'bg-slate-50 text-slate-400 border border-slate-100',
};
const ESTADO_LABELS: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda', RESUELTO: 'Resuelto', ABANDONADO: 'Abandonado', OCULTO: 'Oculto',
};

const ESPECIE_LABELS: Record<string, string> = {
  PERRO: 'Perro', GATO: 'Gato', AVE: 'Ave', CONEJO: 'Conejo',
  HAMSTER: 'Hámster', REPTIL: 'Reptil', OTRO: 'Otro',
};
const TAMANIO_LABELS: Record<string, string> = { PEQUEÑO: 'Pequeño', MEDIANO: 'Mediano', GRANDE: 'Grande' };

const PAGE_SIZE = 12;

/* ── Pagination ───────────────────────────────────────────────────────── */
const Paginacion = ({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) => {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }
  const btn = 'w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors';
  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>
          : <button key={p} onClick={() => onChange(p as number)}
              className={`${btn} ${page === p ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              {p}
            </button>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className={`${btn} border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed`}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

/* ── helpers ──────────────────────────────────────────────────────────── */
const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CL', { year: 'numeric', month: 'short', day: 'numeric' });

const getNombreUsuario = (u: User): string => {
  if (u.ciudadano) return `${u.ciudadano.primer_nombre} ${u.ciudadano.apellido_paterno}`;
  if (u.institucion) return u.institucion.razon_social;
  return u.email;
};

const parseChip = (chip?: string): string => {
  if (!chip) return '—';
  if (chip.startsWith('{') && chip.endsWith('}')) {
    const valores = chip.slice(1, -1)
      .split(',')
      .map(v => v.replace(/^"|"$/g, '').trim())
      .filter(Boolean);
    const unicos = [...new Set(valores)];
    return unicos.length ? unicos.join(', ') : '—';
  }
  return chip;
};

/* ── match score helpers ──────────────────────────────────────────────── */
interface MatchInfo { best: number; total: number; autoConfirmado: boolean }

const scoreBadgeClass = (score: number) => {
  if (score >= 0.80) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (score >= 0.60) return 'bg-amber-100 text-amber-700 border border-amber-200';
  return 'bg-slate-100 text-slate-500 border border-slate-200';
};

const MatchBadge = ({ info }: { info: MatchInfo }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${scoreBadgeClass(info.best)}`}>
    <Zap className="w-2.5 h-2.5" />
    {info.autoConfirmado ? '100% · Auto' : `${Math.round(info.best * 100)}%`}
    {info.total > 1 && <span className="opacity-60">·{info.total}</span>}
  </span>
);

const MATCH_ESTADO_BADGE: Record<string, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-700 border border-amber-200',
  ACEPTADO:  'bg-emerald-100 text-emerald-700 border border-emerald-200',
  RECHAZADO: 'bg-slate-100 text-slate-400 border border-slate-200',
};
const MATCH_ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Pendiente', ACEPTADO: 'Aceptado', RECHAZADO: 'Rechazado',
};

/* ── main ─────────────────────────────────────────────────────────────── */
const AdminReportesPage = () => {
  const [reportes, setReportes]   = useState<Reporte[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [busqueda,      setBusqueda]      = useState('');
  const [filtroTipo,    setFiltroTipo]    = useState('');
  const [filtroEstado,  setFiltroEstado]  = useState('');
  const [filtroEspecie, setFiltroEspecie] = useState('');
  const [page, setPage]                  = useState(1);

  const [seleccionado,   setSeleccionado]   = useState<Reporte | null>(null);
  const [usuariosMap,    setUsuariosMap]    = useState<Record<string, User>>({});
  const [nuevoEstado,    setNuevoEstado]    = useState('');
  const [guardando,      setGuardando]      = useState(false);
  const [errorDetalle,   setErrorDetalle]   = useState('');
  const [successDetalle, setSuccessDetalle] = useState('');

  const [matchScores,      setMatchScores]      = useState<Record<string, MatchInfo>>({});
  const [detalleMatches,   setDetalleMatches]   = useState<Match[]>([]);
  const [filtroConMatch,   setFiltroConMatch]   = useState(false);
  const [loadingAllScores, setLoadingAllScores] = useState(false);
  const loadedIds = useRef<Set<string>>(new Set());

  const cargar = async () => {
    setLoading(true);
    try {
      const res = await listarReportes({ limit: 500, page: 1 });
      setReportes(res.data);
    } catch { setError('Error al cargar los reportes'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    cargar();
    userService.listarUsuarios()
      .then(list => {
        const map: Record<string, User> = {};
        list.forEach(u => {
          map[u.id] = u;
          if (u.credential_id) map[u.credential_id] = u;
        });
        console.debug('[AdminReportesPage] usuariosMap cargado, claves:', Object.keys(map).length);
        setUsuariosMap(map);
      })
      .catch(err => console.error('[AdminReportesPage] listarUsuarios error:', err));
  }, []);

  const handleVer = async (id: string) => {
    try {
      const [r, matches] = await Promise.all([
        obtenerReporte(id),
        listarMatchesPorReporte(id).catch(() => [] as Match[]),
      ]);
      setSeleccionado(r);
      setDetalleMatches(matches);
      setNuevoEstado(r.estado);
      setErrorDetalle(''); setSuccessDetalle('');
    } catch { setError('Error al cargar el reporte'); }
  };

  const handleCambiarEstado = async () => {
    if (!seleccionado || nuevoEstado === seleccionado.estado) return;
    setGuardando(true);
    try {
      const actualizado = await cambiarEstadoReporte(seleccionado.id, nuevoEstado);
      setSeleccionado(actualizado);
      setSuccessDetalle('Estado actualizado correctamente');
      cargar();
    } catch { setErrorDetalle('Error al cambiar el estado'); }
    finally { setGuardando(false); }
  };

  const cargarTodosScores = async () => {
    const pendientes = reportes.filter(r => !loadedIds.current.has(r.id));
    if (!pendientes.length) return;
    setLoadingAllScores(true);
    const BATCH = 20;
    for (let i = 0; i < pendientes.length; i += BATCH) {
      const batch = pendientes.slice(i, i + BATCH);
      batch.forEach(r => loadedIds.current.add(r.id));
      const results = await Promise.all(
        batch.map(r =>
          listarMatchesPorReporte(r.id)
            .then(matches => ({ id: r.id, matches }))
            .catch(() => ({ id: r.id, matches: [] as Match[] }))
        )
      );
      setMatchScores(prev => {
        const next = { ...prev };
        for (const { id, matches } of results) {
          if (!matches.length) continue;
          const best = Math.max(...matches.map(m => m.score));
          next[id] = { best, total: matches.length, autoConfirmado: matches.some(m => m.auto_confirmado) };
        }
        return next;
      });
    }
    setLoadingAllScores(false);
  };

  const toggleFiltroConMatch = () => {
    const next = !filtroConMatch;
    setFiltroConMatch(next);
    setPage(1);
    if (next) cargarTodosScores();
  };

  const reportesFiltrados = useMemo(() => reportes.filter(r => {
    if (filtroTipo    && r.tipo    !== filtroTipo)    return false;
    if (filtroEstado  && r.estado  !== filtroEstado)  return false;
    if (filtroEspecie && r.especie !== filtroEspecie) return false;
    if (filtroConMatch && !matchScores[r.id])         return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      return r.nombreMascota.toLowerCase().includes(q)
        || (r.descripcion?.toLowerCase().includes(q) ?? false)
        || (r.codigoChip?.toLowerCase().includes(q)  ?? false)
        || (r.direccionReferencia?.toLowerCase().includes(q) ?? false);
    }
    return true;
  }), [reportes, busqueda, filtroTipo, filtroEstado, filtroEspecie, filtroConMatch, matchScores]);

  const totalPages = Math.ceil(reportesFiltrados.length / PAGE_SIZE);
  const paginados  = reportesFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Carga scores de los reportes visibles en la página actual
  useEffect(() => {
    const pendientes = paginados.filter(r => !loadedIds.current.has(r.id));
    if (!pendientes.length) return;
    pendientes.forEach(r => loadedIds.current.add(r.id));
    Promise.all(
      pendientes.map(r =>
        listarMatchesPorReporte(r.id)
          .then(matches => ({ id: r.id, matches }))
          .catch(() => ({ id: r.id, matches: [] as Match[] }))
      )
    ).then(results => {
      setMatchScores(prev => {
        const next = { ...prev };
        for (const { id, matches } of results) {
          if (!matches.length) continue;
          const best = Math.max(...matches.map(m => m.score));
          next[id] = {
            best,
            total: matches.length,
            autoConfirmado: matches.some(m => m.auto_confirmado),
          };
        }
        return next;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginados]);

  /* ── DETAIL VIEW ──────────────────────────────────────────────────── */
  if (seleccionado) {
    const r = seleccionado;
    const primerFoto = r.fotos?.[0];
    return (
      <div className="min-h-screen flex flex-col admin-glass">
        <Navbar />

        <div className="bg-white border-b border-slate-100">
          <div className="px-6 lg:px-8 py-5">
            <BotonVolver onClick={() => setSeleccionado(null)} texto="Volver a reportes" />
            <div className="flex items-center gap-4 mt-4">
              {primerFoto ? (
                <img
                  src={`${IMG_BASE}${primerFoto.urlRelativa}`}
                  alt={r.nombreMascota}
                  className="w-14 h-14 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-slate-300" strokeWidth={1.5} />
                </div>
              )}
              <div>
                <h1 className="text-xl font-display font-bold text-slate-900">{r.nombreMascota}</h1>
                <p className="text-sm text-slate-500">
                  {ESPECIE_LABELS[r.especie] ?? r.especie} · {r.color} · {TAMANIO_LABELS[r.tamanio] ?? r.tamanio}
                </p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_BADGE[r.tipo] ?? ''}`}>
                    {TIPO_LABELS[r.tipo] ?? r.tipo}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[r.estado] ?? ''}`}>
                    {ESTADO_LABELS[r.estado] ?? r.estado}
                  </span>
                  {detalleMatches.length > 0 && (() => {
                    const best = Math.max(...detalleMatches.map(m => m.score));
                    return (
                      <MatchBadge info={{
                        best,
                        total: detalleMatches.length,
                        autoConfirmado: detalleMatches.some(m => m.auto_confirmado),
                      }} />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <AnimatePresence>
              {errorDetalle   && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="error">{errorDetalle}</Alert></motion.div>}
              {successDetalle && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Alert variant="success">{successDetalle}</Alert></motion.div>}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Datos del reporte */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Datos del reporte</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {([
                    ['Especie',     ESPECIE_LABELS[r.especie]     ?? r.especie],
                    ['Color',       r.color],
                    ['Tamaño',      TAMANIO_LABELS[r.tamanio]     ?? r.tamanio],
                    ['Chip',        parseChip(r.codigoChip)],
                    ['Publicado',   fmtFecha(r.fechaPublicacion)],
                    ['Actualizado', fmtFecha(r.fechaActualizacion)],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="font-medium text-slate-800">{value}</p>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">ID reporte</p>
                    <p className="font-mono text-xs text-slate-500 break-all">{r.id}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Publicado por</p>
                    {usuariosMap[r.usuarioId] ? (
                      <div>
                        <p className="font-medium text-slate-800">{getNombreUsuario(usuariosMap[r.usuarioId])}</p>
                        <p className="text-xs text-slate-400">{usuariosMap[r.usuarioId].email}</p>
                      </div>
                    ) : (
                      <p className="font-mono text-xs text-slate-400">{r.usuarioId}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Coordenadas</p>
                    <p className="font-medium text-slate-800 text-xs">
                      {r.ubicacionLatitud.toFixed(5)}, {r.ubicacionLongitud.toFixed(5)}
                    </p>
                  </div>
                  {r.direccionReferencia && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 mb-0.5">Dirección referencia</p>
                      <p className="font-medium text-slate-800">{r.direccionReferencia}</p>
                    </div>
                  )}
                  {r.descripcion && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-400 mb-0.5">Descripción</p>
                      <p className="font-medium text-slate-800 text-sm leading-relaxed">{r.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Acciones */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Acciones administrativas</p>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cambiar estado</label>
                  <div className="flex gap-2">
                    <select
                      value={nuevoEstado}
                      onChange={e => setNuevoEstado(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
                    >
                      {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleCambiarEstado}
                      disabled={guardando || nuevoEstado === r.estado}
                      className="px-4 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>

                {/* Fotos */}
                {r.fotos.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                      Fotos ({r.fotos.length})
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {r.fotos.map(foto => (
                        <img
                          key={foto.id}
                          src={`${IMG_BASE}${foto.urlRelativa}`}
                          alt={r.nombreMascota}
                          className="w-full aspect-square object-cover rounded-xl border border-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Coincidencias */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Coincidencias ({detalleMatches.length})
                    </p>
                  </div>
                  {detalleMatches.length === 0 ? (
                    <p className="text-sm text-slate-400">Sin coincidencias registradas.</p>
                  ) : (
                    <div className="space-y-2">
                      {detalleMatches
                        .slice()
                        .sort((a, b) => b.score - a.score)
                        .map(m => (
                          <div key={m.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${scoreBadgeClass(m.score)}`}>
                                <Zap className="w-3 h-3" />
                                {m.auto_confirmado ? '100% · Auto' : `${Math.round(m.score * 100)}%`}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MATCH_ESTADO_BADGE[m.estado] ?? ''}`}>
                                {MATCH_ESTADO_LABEL[m.estado] ?? m.estado}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono truncate">{m.reporte_b_id === r.id ? m.reporte_a_id : m.reporte_b_id}</p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /* ── LIST VIEW ────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col admin-glass">
      <Navbar />

      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-6">
          <BotonVolver ruta="/admin" texto="Panel de control" />
          <div className="flex items-center gap-2.5 mt-3">
            <FileText className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-slate-900">Gestión de Reportes</h1>
          </div>
          {!loading && (
            <p className="text-slate-500 text-sm mt-0.5 ml-7">
              {reportesFiltrados.length} reporte{reportesFiltrados.length !== 1 ? 's' : ''} encontrado{reportesFiltrados.length !== 1 ? 's' : ''}
              {reportesFiltrados.length > PAGE_SIZE && ` · página ${page} de ${totalPages}`}
            </p>
          )}
        </div>

        {/* Filtros */}
        <div className="px-6 lg:px-8 pb-4 space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, dirección o chip..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
            />
          </div>

          {/* Tipo */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">Tipo:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', 'PERDIDA', 'ENCONTRADA'].map(v => (
                <button key={v} onClick={() => { setFiltroTipo(v); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtroTipo === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {v === '' ? 'Todos' : TIPO_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Estado */}
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-2">Estado:</span>
            <div className="flex gap-2 flex-wrap">
              {['', 'EN_BUSQUEDA', 'RESUELTO', 'ABANDONADO', 'OCULTO'].map(v => (
                <button key={v} onClick={() => { setFiltroEstado(v); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtroEstado === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {v === '' ? 'Todos' : ESTADO_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Especie */}
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-2">Especie:</span>
            <div className="flex gap-2 flex-wrap">
              {['', 'PERRO', 'GATO', 'AVE', 'CONEJO', 'HAMSTER', 'REPTIL', 'OTRO'].map(v => (
                <button key={v} onClick={() => { setFiltroEspecie(v); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filtroEspecie === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {v === '' ? 'Todas' : ESPECIE_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Coincidencias */}
          <div>
            <span className="text-xs font-medium text-slate-400 block mb-2">Coincidencias:</span>
            <button
              onClick={toggleFiltroConMatch}
              disabled={loadingAllScores}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                filtroConMatch
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {loadingAllScores ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Zap className="w-3 h-3" />
              )}
              {loadingAllScores ? 'Cargando...' : 'Con coincidencia'}
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <main className="flex-1 py-6 px-6 lg:px-8">
        <AnimatePresence>
          {error   && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4"><Alert variant="error">{error}</Alert></motion.div>}
          {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4"><Alert variant="success">{success}</Alert></motion.div>}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            <p className="text-sm">Cargando reportes...</p>
          </div>
        ) : reportesFiltrados.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
            </div>
            <h2 className="font-display font-bold text-slate-800 mb-1">No hay reportes</h2>
            <p className="text-sm text-slate-400">
              {busqueda ? `Sin resultados para "${busqueda}"` : 'No se encontraron reportes con esos filtros.'}
            </p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {paginados.map((r, i) => {
                const primerFoto = r.fotos?.[0];
                return (
                  <motion.button
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleVer(r.id)}
                    className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-4 text-left transition-all duration-200 group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      {primerFoto ? (
                        <img
                          src={`${IMG_BASE}${primerFoto.urlRelativa}`}
                          alt={r.nombreMascota}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-slate-900 text-sm truncate">{r.nombreMascota}</p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_BADGE[r.tipo] ?? ''}`}>
                              {TIPO_LABELS[r.tipo] ?? r.tipo}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {ESPECIE_LABELS[r.especie] ?? r.especie} · {r.color} · {TAMANIO_LABELS[r.tamanio] ?? r.tamanio}
                        </p>
                        <div className="flex items-center justify-between mt-1.5 gap-1">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ESTADO_BADGE[r.estado] ?? ''}`}>
                            {ESTADO_LABELS[r.estado] ?? r.estado}
                          </span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            {matchScores[r.id] && (
                              <MatchBadge info={matchScores[r.id]!} />
                            )}
                            {r.direccionReferencia && !matchScores[r.id] && (
                              <span className="flex items-center gap-0.5 text-xs text-slate-400 truncate">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{r.direccionReferencia}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminReportesPage;
