import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle, ShieldAlert, RotateCcw, Loader2,
  Clock, User, ExternalLink, ChevronLeft, ChevronRight,
  Ban, Search, Filter, ArrowUpDown,
} from 'lucide-react';
import {
  listarSalasReportadas, listarSalasClausuradas,
  cambiarEstadoSala, type SalaReportada,
} from '../../services/mensajeriaService';
import { userService } from '../../services/userService';
import type { Sala } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Alert from '../../components/ui/Alert';
import BotonVolver from '../../components/layout/BotonVolver';

const PAGE_SIZE = 8;

type Tab   = 'reportadas' | 'clausuradas';
type Orden = 'recientes' | 'antiguas';

/* ── Paginación ────────────────────────────────────────────────────────── */
const Paginacion = ({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) => {
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
  const btn = 'w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors cursor-pointer';
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

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/* ── Página ────────────────────────────────────────────────────────────── */
export default function AdminMensajesPage() {
  const navigate = useNavigate();

  const [tab, setTab]                 = useState<Tab>('reportadas');
  const [reportadas, setReportadas]   = useState<SalaReportada[]>([]);
  const [clausuradas, setClausuradas] = useState<Sala[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [accion, setAccion]           = useState<Record<string, boolean>>({});
  const [page, setPage]               = useState(1);
  const [busqueda, setBusqueda]       = useState('');
  const [orden, setOrden]             = useState<Orden>('recientes');
  // credential_id → nombre para mostrar al lado de cada denuncia
  const [nombresMap, setNombresMap]   = useState<Record<string, string>>({});

  useEffect(() => {
    setCargando(true);
    setError('');
    Promise.all([listarSalasReportadas(), listarSalasClausuradas(), userService.listarUsuarios()])
      .then(([rep, claus, usuarios]) => {
        setReportadas(rep);
        setClausuradas(claus);
        const mapa: Record<string, string> = {};
        for (const u of usuarios) {
          const nombre = u.ciudadano
            ? `${u.ciudadano.primer_nombre} ${u.ciudadano.apellido_paterno}`
            : u.institucion?.nombre_institucion ?? u.email;
          mapa[u.credential_id] = nombre;
        }
        setNombresMap(mapa);
      })
      .catch(() => setError('No se pudieron cargar las conversaciones.'))
      .finally(() => setCargando(false));
  }, []);

  const resetFiltros = () => { setBusqueda(''); setOrden('recientes'); setPage(1); };
  const cambiarTab   = (t: Tab) => { setTab(t); resetFiltros(); };

  /* Filtrado + ordenamiento en frontend */
  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    if (tab === 'reportadas') {
      let lista = reportadas;
      if (q) lista = lista.filter(({ sala, denuncias }) =>
        sala.id.toLowerCase().includes(q) ||
        sala.usuarioAId?.toLowerCase().includes(q) ||
        sala.usuarioBId?.toLowerCase().includes(q) ||
        denuncias.some(d => d.motivo?.toLowerCase().includes(q) || d.reportadoPor?.toLowerCase().includes(q))
      );
      return orden === 'antiguas'
        ? [...lista].sort((a, b) => new Date(a.sala.actualizadoEn).getTime() - new Date(b.sala.actualizadoEn).getTime())
        : lista; // ya viene ordenado DESC del backend
    } else {
      let lista = clausuradas;
      if (q) lista = lista.filter(sala =>
        sala.id.toLowerCase().includes(q) ||
        sala.usuarioAId?.toLowerCase().includes(q) ||
        sala.usuarioBId?.toLowerCase().includes(q)
      );
      return orden === 'antiguas'
        ? [...lista].sort((a, b) => new Date(a.actualizadoEn).getTime() - new Date(b.actualizadoEn).getTime())
        : lista;
    }
  }, [tab, reportadas, clausuradas, busqueda, orden]);

  const totalPages = Math.ceil(itemsFiltrados.length / PAGE_SIZE);
  const paginados  = itemsFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const actuarSala = async (salaId: string, estado: 'ACTIVA' | 'CLAUSURADA') => {
    setAccion(prev => ({ ...prev, [salaId]: true }));
    try {
      await cambiarEstadoSala(salaId, estado);
      if (tab === 'reportadas') {
        setReportadas(prev => {
          const updated = prev.filter(r => r.sala.id !== salaId);
          const newTotal = Math.ceil(
            (busqueda
              ? updated.filter(({ sala, denuncias }) => {
                  const q = busqueda.toLowerCase();
                  return sala.id.toLowerCase().includes(q) ||
                    denuncias.some(d => d.motivo?.toLowerCase().includes(q));
                })
              : updated
            ).length / PAGE_SIZE
          );
          if (page > newTotal) setPage(Math.max(1, newTotal));
          return updated;
        });
        if (estado === 'CLAUSURADA') {
          listarSalasClausuradas().then(setClausuradas).catch(() => {});
        }
      } else {
        setClausuradas(prev => {
          const updated = prev.filter(s => s.id !== salaId);
          const newTotal = Math.ceil(updated.length / PAGE_SIZE);
          if (page > newTotal) setPage(Math.max(1, newTotal));
          return updated;
        });
      }
    } catch {
      setError('No se pudo cambiar el estado de la conversación.');
    } finally {
      setAccion(prev => ({ ...prev, [salaId]: false }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col admin-glass">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-6">
          <BotonVolver ruta="/admin" texto="Panel de control" />
          <div className="flex items-center gap-3 mt-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">Gestión de conversaciones</h1>
              {!cargando && (
                <p className="text-slate-500 text-sm mt-0.5">
                  {itemsFiltrados.length} resultado{itemsFiltrados.length !== 1 ? 's' : ''}
                  {busqueda && ` para "${busqueda}"`}
                  {totalPages > 1 && ` · página ${page} de ${totalPages}`}
                </p>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-slate-100">
            <button
              onClick={() => cambiarTab('reportadas')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 cursor-pointer ${
                tab === 'reportadas'
                  ? 'border-amber-500 text-amber-700 bg-amber-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <ShieldAlert className="w-4 h-4" strokeWidth={1.5} />
              Reportadas
              {!cargando && reportadas.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {reportadas.length}
                </span>
              )}
            </button>
            <button
              onClick={() => cambiarTab('clausuradas')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 cursor-pointer ${
                tab === 'clausuradas'
                  ? 'border-rose-500 text-rose-700 bg-rose-50'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Ban className="w-4 h-4" strokeWidth={1.5} />
              Clausuradas
              {!cargando && clausuradas.length > 0 && (
                <span className="ml-1 bg-rose-100 text-rose-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {clausuradas.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="px-6 lg:px-8 pb-4 space-y-3">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por ID de sala, usuario o motivo..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
            />
          </div>
          {/* Orden */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Filter className="w-4 h-4" />
              <span className="text-xs font-medium">Ordenar por:</span>
            </div>
            {(['recientes', 'antiguas'] as Orden[]).map(o => (
              <button
                key={o}
                onClick={() => { setOrden(o); setPage(1); }}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  orden === o ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ArrowUpDown className="w-3 h-3" />
                {o === 'recientes' ? 'Más recientes' : 'Más antiguas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <main className="flex-1 py-6 px-6 lg:px-8">
        {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

        {cargando ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            <span className="text-sm">Cargando...</span>
          </div>
        ) : itemsFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-7 h-7 text-slate-300" strokeWidth={1.5} />
            </div>
            <h2 className="font-display font-bold text-slate-800 mb-1">Sin resultados</h2>
            <p className="text-sm text-slate-400">
              {busqueda
                ? `No se encontraron conversaciones para "${busqueda}".`
                : tab === 'reportadas'
                  ? 'No hay conversaciones reportadas pendientes.'
                  : 'No hay conversaciones clausuradas.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {tab === 'reportadas'
                ? (paginados as SalaReportada[]).map(({ sala, denuncias }) => (
                  <div key={sala.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

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
                              <p className="text-xs font-semibold text-slate-700 truncate">
                                {nombresMap[d.reportadoPor] ?? 'Usuario desconocido'}
                              </p>
                              {d.motivo
                                ? <p className="text-sm text-slate-700 mt-0.5">{d.motivo}</p>
                                : <p className="text-xs text-slate-400 italic mt-0.5">Sin motivo especificado</p>}
                              <p className="text-[11px] text-slate-400 mt-1">{fmt(d.creadoEn)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/mensajes/${sala.id}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-white transition-colors font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver conversación
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => actuarSala(sala.id, 'ACTIVA')}
                        disabled={accion[sala.id]}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                      >
                        {accion[sala.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Restaurar
                      </button>
                      <button
                        onClick={() => actuarSala(sala.id, 'CLAUSURADA')}
                        disabled={accion[sala.id]}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 bg-rose-100 text-rose-700 rounded-xl hover:bg-rose-200 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                      >
                        {accion[sala.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                        Clausurar
                      </button>
                    </div>
                  </div>
                ))
                : (paginados as Sala[]).map((sala) => (
                  <div key={sala.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                    <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-rose-500" strokeWidth={1.5} />
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
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-600 shrink-0">
                        CLAUSURADA
                      </span>
                    </div>

                    <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate(`/mensajes/${sala.id}`)}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-white transition-colors font-medium cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver conversación
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => actuarSala(sala.id, 'ACTIVA')}
                        disabled={accion[sala.id]}
                        className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 disabled:opacity-50 transition-colors font-medium cursor-pointer"
                      >
                        {accion[sala.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        Restaurar
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
            <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
