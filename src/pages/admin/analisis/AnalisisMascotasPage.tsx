import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PawPrint, TrendingUp, Search, CheckCircle, Loader2, X, SlidersHorizontal, MapPin } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getEstadisticasReportes, listarReportes, type EstadisticasReportes } from '../../../services/reporteService';
import type { Reporte } from '../../../types';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Alert from '../../../components/ui/Alert';
import DetailPanel from '../../../components/admin/DetailPanel';

/* ── paletas ──────────────────────────────────────────────────────────── */
const ESPECIE_COLORS: Record<string, string> = {
  PERRO: '#f59e0b', GATO: '#6366f1', AVE: '#10b981', CONEJO: '#f97316',
  HAMSTER: '#8b5cf6', REPTIL: '#06b6d4', OTRO: '#94a3b8',
};
const TIPO_COLORS = { PERDIDA: '#ef4444', ENCONTRADA: '#10b981' };
const ESTADO_COLORS: Record<string, string> = {
  EN_BUSQUEDA: '#f59e0b', RESUELTO: '#10b981', ABANDONADO: '#94a3b8', OCULTO: '#e2e8f0',
};
const TAMANIO_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa'];

const especieLabel: Record<string, string> = {
  PERRO: 'Perro', GATO: 'Gato', AVE: 'Ave', CONEJO: 'Conejo',
  HAMSTER: 'Hámster', REPTIL: 'Reptil', OTRO: 'Otro',
};
const estadoLabel: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda', RESUELTO: 'Resuelto', ABANDONADO: 'Abandonado', OCULTO: 'Oculto',
};
const tamanioLabel: Record<string, string> = { PEQUEÑO: 'Pequeño', MEDIANO: 'Mediano', GRANDE: 'Grande' };

/* ── helpers ──────────────────────────────────────────────────────────── */
const fmtMes = (mes: string) => {
  const [y, m] = mes.split('-');
  return `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]} ${y.slice(2)}`;
};
const inRange = (mes: string, desde: string, hasta: string) =>
  (!desde || mes >= desde) && (!hasta || mes <= hasta);

const TIPO_BADGE: Record<string, string> = {
  PERDIDA:    'bg-rose-100 text-rose-700',
  ENCONTRADA: 'bg-emerald-100 text-emerald-700',
};
const ESTADO_BADGE: Record<string, string> = {
  EN_BUSQUEDA: 'bg-amber-100 text-amber-700',
  RESUELTO:    'bg-emerald-100 text-emerald-700',
  ABANDONADO:  'bg-slate-100 text-slate-500',
  OCULTO:      'bg-slate-50 text-slate-400',
};
const ESTADO_LABEL_BADGE: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda', RESUELTO: 'Resuelto', ABANDONADO: 'Abandonado', OCULTO: 'Oculto',
};
const fmtFecha = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const inDateRange = (iso?: string, desde?: string, hasta?: string) => {
  if (!iso || (!desde && !hasta)) return true;
  const ym = iso.slice(0, 7);
  return (!desde || ym >= desde) && (!hasta || ym <= hasta);
};

const KpiCard = ({ icon: Icon, value, label, color, sub, onClick }: {
  icon: React.ElementType; value: string | number; label: string; color: string; sub?: string; onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 active:scale-[0.99]' : ''}`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
    {onClick && <span className="text-[10px] text-slate-300 flex-shrink-0">Ver →</span>}
  </div>
);

const ChartCard = ({ title, children, className = '', note }: {
  title: string; children: React.ReactNode; className?: string; note?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
    <p className="text-sm font-semibold text-slate-700 mb-4">{title}</p>
    {children}
    {note && <p className="text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-50 italic">{note}</p>}
  </motion.div>
);

const InsightCard = ({ label, value, sub, bar, onClick }: {
  label: string; value: string | number; sub?: string; bar?: number; onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 active:scale-[0.99]' : ''}`}
  >
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
      {onClick && <span className="text-[10px] text-slate-300">Ver →</span>}
    </div>
    <p className="text-2xl font-display font-bold text-slate-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    {bar !== undefined && (
      <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(bar, 100)}%`, backgroundColor: bar >= 80 ? '#10b981' : bar >= 50 ? '#f59e0b' : '#ef4444' }} />
      </div>
    )}
  </div>
);

/* ── tabla de reportes en el panel ───────────────────────────────────── */
const ReportesTable = ({ reportes }: { reportes: Reporte[] }) => {
  if (!reportes.length)
    return <p className="text-sm text-slate-400 text-center py-16">No hay registros para mostrar.</p>;
  return (
    <div className="px-6 py-4">
      <p className="text-xs text-slate-400 mb-3">{reportes.length} registro{reportes.length !== 1 ? 's' : ''}</p>
      <div className="space-y-2">
        {reportes.map(r => (
          <div key={r.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{r.nombreMascota}</p>
              <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400 truncate">
                {r.direccionReferencia ? (
                  <><MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{r.direccionReferencia}</span></>
                ) : (
                  <span>{especieLabel[r.especie] ?? r.especie}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIPO_BADGE[r.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                {r.tipo === 'PERDIDA' ? 'Perdida' : 'Encontrada'}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE[r.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                {ESTADO_LABEL_BADGE[r.estado] ?? r.estado}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block">{fmtFecha(r.fechaPublicacion)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── panel state ──────────────────────────────────────────────────────── */
interface PanelState { open: boolean; title: string; subtitle: string; reportes: Reporte[]; loading: boolean; }
const PANEL_CLOSED: PanelState = { open: false, title: '', subtitle: '', reportes: [], loading: false };

const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  ) : null;

const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';

/* ── página ───────────────────────────────────────────────────────────── */
const AnalisisMascotasPage = () => {
  const [stats,   setStats]   = useState<EstadisticasReportes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [panel,   setPanel]   = useState<PanelState>(PANEL_CLOSED);

  /* filtros */
  const [mesDesde,      setMesDesde]      = useState('');
  const [mesHasta,      setMesHasta]      = useState('');
  const [filtroTipo,    setFiltroTipo]    = useState(''); // PERDIDA | ENCONTRADA | ''
  const [filtroEspecie, setFiltroEspecie] = useState('');

  useEffect(() => {
    getEstadisticasReportes()
      .then(setStats)
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, []);

  /* ── abrir panel ─────────────────────────────────────────────────── */
  const openPanel = useCallback(async (title: string, overrides?: { tipo?: string; estado?: string; especie?: string }) => {
    setPanel({ open: true, title, subtitle: '', reportes: [], loading: true });
    try {
      const tipo    = overrides?.tipo    ?? filtroTipo    ?? undefined;
      const especie = overrides?.especie ?? filtroEspecie ?? undefined;
      const estado  = overrides?.estado;
      const res = await listarReportes({
        ...(tipo    ? { tipo }    : {}),
        ...(especie ? { especie } : {}),
        ...(estado  ? { estado }  : {}),
        limit: 500,
      });
      let lista = res.data;
      if (mesDesde || mesHasta)
        lista = lista.filter(r => inDateRange(r.fechaPublicacion, mesDesde, mesHasta));
      const sub = [
        mesDesde && `desde ${mesDesde}`, mesHasta && `hasta ${mesHasta}`,
        tipo && (tipo === 'PERDIDA' ? 'Perdidas' : 'Encontradas'),
        especie && (especieLabel[especie] ?? especie),
        estado && (ESTADO_LABEL_BADGE[estado] ?? estado),
      ].filter(Boolean).join(' · ');
      setPanel(p => ({ ...p, loading: false, reportes: lista, subtitle: sub }));
    } catch {
      setPanel(p => ({ ...p, loading: false }));
    }
  }, [filtroTipo, filtroEspecie, mesDesde, mesHasta]);

  const filtrosActivos = !!(mesDesde || mesHasta || filtroTipo || filtroEspecie);
  const filtrosCount   = [mesDesde, mesHasta, filtroTipo, filtroEspecie].filter(Boolean).length;
  const resetFiltros = () => { setMesDesde(''); setMesHasta(''); setFiltroTipo(''); setFiltroEspecie(''); };

  /* mes total */
  const mesData = useMemo(() => {
    if (!stats) return [];
    let rows = (stats.por_mes ?? []).filter(d => inRange(d.mes, mesDesde, mesHasta));
    if (filtroTipo || filtroEspecie) {
      /* re-aggregate from granular rows */
      const src = filtroEspecie
        ? (stats.por_mes_especie ?? []).filter(d =>
            inRange(d.mes, mesDesde, mesHasta) && d.especie === filtroEspecie)
        : (stats.por_mes_tipo ?? []).filter(d =>
            inRange(d.mes, mesDesde, mesHasta) && (!filtroTipo || d.tipo === filtroTipo));
      const map: Record<string, number> = {};
      src.forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    return rows.map(d => ({ mes: fmtMes(d.mes), count: d.count }));
  }, [stats, mesDesde, mesHasta, filtroTipo, filtroEspecie]);

  /* tipo por mes */
  const tipoMesData = useMemo(() => {
    if (!stats) return [];
    const tipos = filtroTipo ? [filtroTipo as 'PERDIDA' | 'ENCONTRADA'] : ['PERDIDA', 'ENCONTRADA'] as const;
    const rows = (stats.por_mes_tipo ?? [])
      .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroTipo || d.tipo === filtroTipo));
    const map: Record<string, { PERDIDA: number; ENCONTRADA: number }> = {};
    rows.forEach(({ mes, tipo, count }) => {
      if (!map[mes]) map[mes] = { PERDIDA: 0, ENCONTRADA: 0 };
      if (tipo === 'PERDIDA' || tipo === 'ENCONTRADA') map[mes][tipo] = count;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({ mes: fmtMes(mes), ...Object.fromEntries(tipos.map(t => [t, vals[t] ?? 0])) }));
  }, [stats, mesDesde, mesHasta, filtroTipo]);

  /* especie por mes */
  const especieMesData = useMemo(() => {
    if (!stats) return [];
    const especies = filtroEspecie ? [filtroEspecie] : (stats.por_especie ?? []).filter(e => e.count > 0).map(e => e.especie);
    const rows = (stats.por_mes_especie ?? [])
      .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroEspecie || d.especie === filtroEspecie));
    const map: Record<string, Record<string, number>> = {};
    rows.forEach(({ mes, especie, count }) => {
      if (!map[mes]) map[mes] = {};
      map[mes][especie] = count;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({ mes: fmtMes(mes), ...Object.fromEntries(especies.map(e => [e, vals[e] ?? 0])) }));
  }, [stats, mesDesde, mesHasta, filtroEspecie]);

  /* pie especie re-agregado */
  const especiePieData = useMemo(() => {
    if (!stats) return [];
    if (filtrosActivos && (mesDesde || mesHasta)) {
      const map: Record<string, number> = {};
      (stats.por_mes_especie ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroEspecie || d.especie === filtroEspecie))
        .forEach(d => { map[d.especie] = (map[d.especie] ?? 0) + d.count; });
      return Object.entries(map).filter(([,v]) => v > 0)
        .map(([esp, count]) => ({ name: especieLabel[esp] ?? esp, value: count, fill: ESPECIE_COLORS[esp] ?? '#94a3b8', especie: esp }));
    }
    return (stats.por_especie ?? [])
      .filter(e => e.count > 0 && (!filtroEspecie || e.especie === filtroEspecie))
      .map(e => ({ name: especieLabel[e.especie] ?? e.especie, value: e.count, fill: ESPECIE_COLORS[e.especie] ?? '#94a3b8', especie: e.especie }));
  }, [stats, mesDesde, mesHasta, filtroEspecie, filtrosActivos]);

  const totalPeriodo       = useMemo(() => mesData.reduce((s, d) => s + d.count, 0), [mesData]);
  const perdidosPeriodo    = useMemo(
    () => tipoMesData.reduce((s, d) => s + ((d as any).PERDIDA    ?? 0), 0), [tipoMesData]);
  const encontradosPeriodo = useMemo(
    () => tipoMesData.reduce((s, d) => s + ((d as any).ENCONTRADA ?? 0), 0), [tipoMesData]);

  /* crecimiento mes a mes */
  const crecimientoData = useMemo(() =>
    mesData.map((d, i) => ({
      mes: d.mes,
      count: d.count,
      pct: i === 0 || mesData[i - 1].count === 0
        ? null
        : +((d.count - mesData[i - 1].count) / mesData[i - 1].count * 100).toFixed(1),
    })),
  [mesData]);

  /* ratio perdida/encontrada por mes */
  const ratioMesData = useMemo(() =>
    tipoMesData.map(d => {
      const p = (d as any).PERDIDA ?? 0;
      const e = (d as any).ENCONTRADA ?? 0;
      return { mes: d.mes, ratio: e > 0 ? +(p / e).toFixed(2) : null };
    }),
  [tipoMesData]);

  const especiesActivas = useMemo(
    () => filtroEspecie ? [filtroEspecie] : (stats?.por_especie ?? []).filter(e => e.count > 0).map(e => e.especie),
    [stats, filtroEspecie],
  );
  const tiposActivos = filtroTipo ? [filtroTipo] : ['PERDIDA', 'ENCONTRADA'];

  if (loading) return (
    <div className="min-h-screen flex flex-col admin-glass"><Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" /><p className="text-sm">Cargando análisis...</p>
      </div><Footer /></div>
  );
  if (error || !stats) return (
    <div className="min-h-screen flex flex-col admin-glass"><Navbar />
      <div className="flex-1 px-6 py-10"><Alert variant="error">{error || 'Sin datos'}</Alert></div><Footer /></div>
  );

  const perdidos    = stats.por_tipo.find(t => t.tipo === 'PERDIDA')?.count ?? 0;
  const encontrados = stats.por_tipo.find(t => t.tipo === 'ENCONTRADA')?.count ?? 0;
  const resueltos   = stats.por_estado.find(e => e.estado === 'RESUELTO')?.count ?? 0;
  const enBusqueda  = stats.por_estado.find(e => e.estado === 'EN_BUSQUEDA')?.count ?? 0;
  const abandonados = stats.por_estado.find(e => e.estado === 'ABANDONADO')?.count ?? 0;

  /* indicadores derivados */
  const tasaResolucion  = stats.total > 0 ? Math.round((resueltos / stats.total) * 100) : 0;
  const tasaAbandono    = stats.total > 0 ? Math.round((abandonados / stats.total) * 100) : 0;
  const ratioPE         = encontrados > 0 ? (perdidos / encontrados).toFixed(2) : '∞';
  const meses           = stats.por_mes ?? [];
  const mesPico         = [...meses].sort((a, b) => b.count - a.count)[0] ?? null;
  const especiePrincipal = [...(stats.por_especie ?? [])].sort((a, b) => b.count - a.count)[0] ?? null;
  const promedioMensual  = meses.length > 0 ? Math.round(stats.total / meses.length) : 0;
  const estadoPieData = (stats.por_estado ?? []).filter(e => e.count > 0)
    .map(e => ({ name: estadoLabel[e.estado] ?? e.estado, value: e.count, fill: ESTADO_COLORS[e.estado] ?? '#94a3b8' }));
  const tamanioData = (stats.por_tamanio ?? []).map((t, i) => ({
    tamanio: tamanioLabel[t.tamanio] ?? t.tamanio, count: t.count, fill: TAMANIO_COLORS[i] ?? '#94a3b8',
  }));

  return (
    <div className="min-h-screen flex flex-col admin-glass">
      <Navbar />

      {/* ── Panel detalle ─────────────────────────────────────────────── */}
      <DetailPanel
        isOpen={panel.open}
        onClose={() => setPanel(PANEL_CLOSED)}
        title={panel.title}
        subtitle={panel.subtitle || undefined}
        loading={panel.loading}
      >
        <ReportesTable reportes={panel.reportes} />
      </DetailPanel>

      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <PawPrint className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-slate-900">Análisis de Mascotas</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-7">Reportes de mascotas perdidas y encontradas en Chile</p>
        </div>

        {/* Filtros */}
        <div className="px-6 lg:px-8 pb-4 border-t border-slate-50">
          <div className="flex flex-wrap items-end gap-3 pt-3">
            <div className="flex items-center gap-1.5 text-slate-400 self-center">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-medium">Filtros:</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Desde</label>
              <input type="month" value={mesDesde} onChange={e => setMesDesde(e.target.value)} className={selectCls} />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Hasta</label>
              <input type="month" value={mesHasta} onChange={e => setMesHasta(e.target.value)} className={selectCls} />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Tipo</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                <option value="PERDIDA">Perdida</option>
                <option value="ENCONTRADA">Encontrada</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Especie</label>
              <select value={filtroEspecie} onChange={e => setFiltroEspecie(e.target.value)} className={selectCls}>
                <option value="">Todas</option>
                {Object.entries(especieLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {filtrosActivos && (
              <>
                <span className="self-center inline-flex items-center gap-1 text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-200 px-2.5 py-1.5 rounded-full">
                  {filtrosCount} filtro{filtrosCount > 1 ? 's' : ''} activo{filtrosCount > 1 ? 's' : ''}
                </span>
                <button onClick={resetFiltros}
                  className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all self-end">
                  <X className="w-3.5 h-3.5" /> Limpiar filtros
                </button>
              </>
            )}
          </div>
          {filtrosActivos && (
            <p className="text-xs text-brand-600 font-medium mt-2">
              Mostrando {mesData.length} mes{mesData.length !== 1 ? 'es' : ''} · {totalPeriodo} reportes en el período
            </p>
          )}
        </div>
      </div>

      <main className="flex-1 py-6 px-6 lg:px-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={PawPrint}
            value={filtrosActivos ? totalPeriodo : stats.total}
            label={filtrosActivos ? 'Reportes en período' : 'Total reportes'}
            color="bg-amber-500"
            onClick={() => openPanel('Todos los reportes')} />
          <KpiCard icon={Search}
            value={filtrosActivos ? perdidosPeriodo : perdidos}
            label="Mascotas perdidas"
            color="bg-rose-500"
            sub={filtrosActivos && filtroEspecie ? 'sin desglose por especie' : undefined}
            onClick={() => openPanel('Mascotas perdidas', { tipo: 'PERDIDA' })} />
          <KpiCard icon={TrendingUp}
            value={filtrosActivos ? encontradosPeriodo : encontrados}
            label="Mascotas encontradas"
            color="bg-emerald-500"
            sub={filtrosActivos && filtroEspecie ? 'sin desglose por especie' : undefined}
            onClick={() => openPanel('Mascotas encontradas', { tipo: 'ENCONTRADA' })} />
          <KpiCard icon={CheckCircle}
            value={resueltos}
            label="Casos resueltos"
            color="bg-indigo-500"
            sub={filtrosActivos ? 'estado actual del sistema' : undefined}
            onClick={() => openPanel('Casos resueltos', { estado: 'RESUELTO' })} />
        </div>

        {/* ── Indicadores derivados ─────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Indicadores derivados</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              label="Tasa de resolución"
              value={`${tasaResolucion}%`}
              sub={`${resueltos} de ${stats.total} reportes resueltos`}
              bar={tasaResolucion}
              onClick={() => openPanel('Casos resueltos', { estado: 'RESUELTO' })}
            />
            <InsightCard
              label="Tasa de abandono"
              value={`${tasaAbandono}%`}
              sub={`${abandonados} reportes sin seguimiento`}
              onClick={() => openPanel('Reportes abandonados', { estado: 'ABANDONADO' })}
            />
            <InsightCard
              label="Ratio pérdida / encontrada"
              value={ratioPE}
              sub={ratioPE !== '∞' ? (Number(ratioPE) > 1 ? 'Más reportes de pérdida' : 'Balance favorable') : 'Sin reportes encontradas'}
              onClick={() => openPanel('Todos los reportes')}
            />
            <InsightCard
              label="Especie más reportada"
              value={especiePrincipal ? (especieLabel[especiePrincipal.especie] ?? especiePrincipal.especie) : '—'}
              sub={especiePrincipal ? `${especiePrincipal.count} reportes (${Math.round(especiePrincipal.count / stats.total * 100)}%)` : undefined}
              onClick={especiePrincipal ? () => openPanel(`${especieLabel[especiePrincipal.especie] ?? especiePrincipal.especie}`, { especie: especiePrincipal.especie }) : undefined}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Promedio histórico: <span className="font-semibold text-slate-600">{promedioMensual}</span> reportes/mes
            {mesPico && <> · Mes pico: <span className="font-semibold text-slate-600">{fmtMes(mesPico.mes)}</span> ({mesPico.count} reportes)</>}
          </p>
        </div>

        {/* Reportes por mes */}
        <ChartCard title={filtrosActivos ? `Reportes por mes (período filtrado · ${totalPeriodo} total)` : 'Reportes por mes'}>
          {mesData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin datos en el período seleccionado</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMascotas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Reportes" stroke="#f59e0b"
                  strokeWidth={2} fill="url(#gradMascotas)" dot={{ r: 3, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Variación mes a mes ──────────────────────────────────── */}
        {crecimientoData.length > 1 && (
          <ChartCard title="Variación mensual · reportes (barras) y crecimiento % vs mes anterior (línea)">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={crecimientoData} margin={{ top: 4, right: 44, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar yAxisId="left" dataKey="count" name="Reportes" fill="#f59e0b" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="pct" name="Variación %" stroke="#6366f1"
                  strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* ── Ratio Pérdida / Encontrada por mes ───────────────────── */}
        {ratioMesData.some(d => d.ratio !== null) && (
          <ChartCard title="Ratio Pérdida/Encontrada por mes · valores >1 indican más pérdidas que encontradas">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={ratioMesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v}`, 'Ratio P/E']} />
                <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Equilibrio', position: 'right', fontSize: 10, fill: '#94a3b8' }} />
                <Line type="monotone" dataKey="ratio" name="Ratio P/E" stroke="#ef4444"
                  strokeWidth={2} dot={{ r: 4, fill: '#ef4444' }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Tipo por mes + Estado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Perdidas vs Encontradas por mes"
            note={filtroEspecie ? 'El desglose por tipo no incluye dimensión de especie — el filtro de especie no aplica a esta vista' : undefined}>
            {tipoMesData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos en el período seleccionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tipoMesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  {tiposActivos.map(t => (
                    <Area key={t} type="monotone" dataKey={t}
                      name={t === 'PERDIDA' ? 'Perdida' : 'Encontrada'}
                      stroke={TIPO_COLORS[t as keyof typeof TIPO_COLORS]}
                      fill={TIPO_COLORS[t as keyof typeof TIPO_COLORS]}
                      fillOpacity={0.15} strokeWidth={2} dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Distribución por especie"
            note={filtroTipo ? 'El desglose por especie no incluye dimensión de tipo — el filtro de tipo no aplica a esta vista' : undefined}>
            {especiePieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={especiePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={82}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {especiePieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Reportes']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Evolución por especie */}
        {especieMesData.length > 0 && (
          <ChartCard title="Evolución por especie">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={especieMesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                {especiesActivas.map(e => (
                  <Area key={e} type="monotone" dataKey={e} name={especieLabel[e] ?? e}
                    stroke={ESPECIE_COLORS[e] ?? '#94a3b8'} fill={ESPECIE_COLORS[e] ?? '#94a3b8'}
                    fillOpacity={0.1} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Tamaño + Ranking especie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Distribución por tamaño" note="Datos totales — no varía con filtros">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tamanioData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tamanio" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reportes" radius={[4, 4, 0, 0]}>
                  {tamanioData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Ranking de especies más reportadas"
            note={filtroTipo ? 'El desglose por especie no incluye dimensión de tipo — el filtro de tipo no aplica a esta vista' : undefined}>
            {especiePieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, especiePieData.length * 36)}>
                <BarChart
                  data={[...especiePieData].sort((a,b) => b.value - a.value).map(e => ({ especie: e.name, count: e.value, fill: e.fill }))}
                  layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="especie" tick={{ fontSize: 11, fill: '#64748b' }} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Reportes" radius={[0, 4, 4, 0]}>
                    {[...especiePieData].sort((a,b) => b.value - a.value).map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Estado actual */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Estado actual del sistema
            <span className="text-[10px] font-normal text-slate-400 ml-2 italic">· Snapshot global — no varía con filtros</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.por_estado.map(e => (
              <div key={e.estado} className="border border-slate-100 bg-slate-50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ESTADO_COLORS[e.estado] ?? '#94a3b8' }} />
                  <p className="text-xs text-slate-500">{estadoLabel[e.estado] ?? e.estado}</p>
                </div>
                <p className="text-xl font-bold text-slate-900">{e.count}</p>
                {stats.total > 0 && (
                  <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((e.count / stats.total) * 100)}% del total</p>
                )}
              </div>
            ))}
          </div>
          {stats.total > 0 && (
            <p className="text-xs text-slate-400 mt-3">
              Tasa de resolución: <span className="font-semibold text-emerald-600">{Math.round((resueltos / stats.total) * 100)}%</span>
              {' · '}En búsqueda activa: <span className="font-semibold text-amber-600">{enBusqueda}</span> mascotas
            </p>
          )}
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default AnalisisMascotasPage;
