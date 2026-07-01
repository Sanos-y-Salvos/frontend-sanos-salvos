import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Loader2, X, SlidersHorizontal } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ticketService } from '../../../services/ticketService';
import type { Ticket } from '../../../types';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Alert from '../../../components/ui/Alert';
import DetailPanel from '../../../components/admin/DetailPanel';

type Stats = Awaited<ReturnType<typeof ticketService.getEstadisticas>>;

/* ── paletas ──────────────────────────────────────────────────────────── */
const ESTADO_COLORS: Record<string, string> = {
  abierto: '#6366f1', en_proceso: '#f59e0b', resuelto: '#10b981', cerrado: '#94a3b8',
};
const CAT_COLORS: Record<string, string> = {
  problema_tecnico: '#6366f1', reporte_abuso: '#ef4444', otro: '#94a3b8',
};
const CAT_LABELS: Record<string, string> = {
  problema_tecnico: 'Problema técnico', reporte_abuso: 'Reporte de abuso', otro: 'Otro',
};
const ESTADO_LABELS: Record<string, string> = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};

/* ── helpers ──────────────────────────────────────────────────────────── */
const fmtMes = (mes: string) => {
  const [y, m] = mes.split('-');
  return `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]} ${y.slice(2)}`;
};
const inRange = (mes: string, desde: string, hasta: string) =>
  (!desde || mes >= desde) && (!hasta || mes <= hasta);

const ESTADO_BADGE_TK: Record<string, string> = {
  abierto:    'bg-indigo-100 text-indigo-700',
  en_proceso: 'bg-amber-100 text-amber-700',
  resuelto:   'bg-emerald-100 text-emerald-700',
  cerrado:    'bg-slate-100 text-slate-500',
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

/* ── tabla de tickets en el panel ─────────────────────────────────────── */
const TicketsTable = ({ tickets }: { tickets: Ticket[] }) => {
  if (!tickets.length)
    return <p className="text-sm text-slate-400 text-center py-16">No hay registros para mostrar.</p>;
  return (
    <div className="px-6 py-4">
      <p className="text-xs text-slate-400 mb-3">{tickets.length} registro{tickets.length !== 1 ? 's' : ''}</p>
      <div className="space-y-2">
        {tickets.map(t => (
          <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{t.asunto || '(sin asunto)'}</p>
              <p className="text-xs text-slate-400 truncate">{CAT_LABELS[t.categoria] ?? t.categoria}{t.email_contacto ? ` · ${t.email_contacto}` : ''}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE_TK[t.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                {ESTADO_LABELS[t.estado] ?? t.estado}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block">{fmtFecha(t.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── panel state ──────────────────────────────────────────────────────── */
interface PanelState { open: boolean; title: string; subtitle: string; tickets: Ticket[]; loading: boolean; }
const PANEL_CLOSED: PanelState = { open: false, title: '', subtitle: '', tickets: [], loading: false };

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
const AnalisisTicketsPage = () => {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [panel,   setPanel]   = useState<PanelState>(PANEL_CLOSED);

  /* filtros */
  const [mesDesde,    setMesDesde]    = useState('');
  const [mesHasta,    setMesHasta]    = useState('');
  const [filtroCateg, setFiltroCateg] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    ticketService.getEstadisticas()
      .then(setStats)
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, []);

  /* ── abrir panel ─────────────────────────────────────────────────── */
  const openPanel = useCallback(async (title: string, overrideEstado?: string | string[]) => {
    setPanel({ open: true, title, subtitle: '', tickets: [], loading: true });
    try {
      const estados = overrideEstado
        ? (Array.isArray(overrideEstado) ? overrideEstado : [overrideEstado])
        : (filtroEstado ? [filtroEstado] : []);

      let lista: Ticket[] = [];
      if (estados.length === 0) {
        lista = await ticketService.listarTickets();
      } else if (estados.length === 1) {
        lista = await ticketService.listarTickets(estados[0]);
      } else {
        const listas = await Promise.all(estados.map(e => ticketService.listarTickets(e)));
        lista = listas.flat();
      }

      if (filtroCateg) lista = lista.filter(t => t.categoria === filtroCateg);
      if (mesDesde || mesHasta) lista = lista.filter(t => inDateRange(t.created_at, mesDesde, mesHasta));

      const sub = [
        mesDesde && `desde ${mesDesde}`, mesHasta && `hasta ${mesHasta}`,
        filtroCateg && (CAT_LABELS[filtroCateg] ?? filtroCateg),
      ].filter(Boolean).join(' · ');
      setPanel(p => ({ ...p, loading: false, tickets: lista, subtitle: sub }));
    } catch {
      setPanel(p => ({ ...p, loading: false }));
    }
  }, [filtroEstado, filtroCateg, mesDesde, mesHasta]);

  const filtrosActivos = !!(mesDesde || mesHasta || filtroCateg || filtroEstado);
  const filtrosCount   = [mesDesde, mesHasta, filtroCateg, filtroEstado].filter(Boolean).length;
  const resetFiltros = () => { setMesDesde(''); setMesHasta(''); setFiltroCateg(''); setFiltroEstado(''); };

  /* mes total — re-agrega desde la fuente granular correspondiente al filtro activo */
  const mesData = useMemo(() => {
    if (!stats) return [];
    if (filtroEstado && !filtroCateg) {
      const map: Record<string, number> = {};
      (stats.por_mes_estado ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && d.estado === filtroEstado)
        .forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    if (filtroCateg) {
      const map: Record<string, number> = {};
      (stats.por_mes_categoria ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && d.categoria === filtroCateg)
        .forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    return (stats.por_mes ?? [])
      .filter(d => inRange(d.mes, mesDesde, mesHasta))
      .map(d => ({ mes: fmtMes(d.mes), count: d.count }));
  }, [stats, mesDesde, mesHasta, filtroCateg, filtroEstado]);

  /* categorías por mes */
  const catMesData = useMemo(() => {
    if (!stats) return [];
    const cats = filtroCateg ? [filtroCateg] : ['problema_tecnico', 'reporte_abuso', 'otro'];
    const rows = (stats.por_mes_categoria ?? [])
      .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroCateg || d.categoria === filtroCateg));
    const map: Record<string, Record<string, number>> = {};
    rows.forEach(({ mes, categoria, count }) => {
      if (!map[mes]) map[mes] = {};
      map[mes][categoria] = count;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({ mes: fmtMes(mes), ...Object.fromEntries(cats.map(c => [c, vals[c] ?? 0])) }));
  }, [stats, mesDesde, mesHasta, filtroCateg]);

  /* pie categoría re-agregado */
  const catPieData = useMemo(() => {
    if (!stats) return [];
    if (filtrosActivos && (mesDesde || mesHasta)) {
      const map: Record<string, number> = {};
      (stats.por_mes_categoria ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroCateg || d.categoria === filtroCateg))
        .forEach(d => { map[d.categoria] = (map[d.categoria] ?? 0) + d.count; });
      return Object.entries(map).filter(([,v]) => v > 0)
        .map(([cat, count]) => ({ name: CAT_LABELS[cat] ?? cat, value: count, fill: CAT_COLORS[cat] ?? '#94a3b8' }));
    }
    return stats.por_categoria.filter(c => c.count > 0 && (!filtroCateg || c.categoria === filtroCateg))
      .map(c => ({ name: CAT_LABELS[c.categoria] ?? c.categoria, value: c.count, fill: CAT_COLORS[c.categoria] ?? '#94a3b8' }));
  }, [stats, mesDesde, mesHasta, filtroCateg, filtrosActivos]);

  /* pie estado — re-agrega desde por_mes_estado cuando hay filtro de fechas */
  const estadoPieData = useMemo(() => {
    if (!stats) return [];
    if (mesDesde || mesHasta) {
      const map: Record<string, number> = {};
      (stats.por_mes_estado ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && (!filtroEstado || d.estado === filtroEstado))
        .forEach(d => { map[d.estado] = (map[d.estado] ?? 0) + d.count; });
      return Object.entries(map).filter(([, v]) => v > 0)
        .map(([estado, count]) => ({ name: ESTADO_LABELS[estado] ?? estado, value: count, fill: ESTADO_COLORS[estado] ?? '#94a3b8' }));
    }
    return stats.por_estado.filter(e => e.count > 0 && (!filtroEstado || e.estado === filtroEstado))
      .map(e => ({ name: ESTADO_LABELS[e.estado] ?? e.estado, value: e.count, fill: ESTADO_COLORS[e.estado] ?? '#94a3b8' }));
  }, [stats, mesDesde, mesHasta, filtroEstado]);

  const totalPeriodo = useMemo(() => {
    if (!stats) return 0;
    // Sin rango de fechas: leer desde los totales pre-agregados (siempre correctos)
    if (!mesDesde && !mesHasta) {
      if (filtroEstado && !filtroCateg)
        return stats.por_estado.find(e => e.estado === filtroEstado)?.count ?? 0;
      if (filtroCateg && !filtroEstado)
        return stats.por_categoria.find(c => c.categoria === filtroCateg)?.count ?? 0;
    }
    return mesData.reduce((s, d) => s + d.count, 0);
  }, [stats, mesData, filtroEstado, filtroCateg, mesDesde, mesHasta]);
  const catsActivas  = filtroCateg ? [filtroCateg] : ['problema_tecnico', 'reporte_abuso', 'otro'];

  /* tiempo de resolución — respeta filtro de fechas usando el desglose mensual */
  const tiempoData = useMemo(() => {
    if (!stats) return [];
    if (mesDesde || mesHasta) {
      const map: Record<string, { suma: number; n: number }> = {};
      (stats.tiempo_resolucion_mensual ?? [])
        .filter(t => inRange(t.mes, mesDesde, mesHasta) && (!filtroCateg || t.categoria === filtroCateg))
        .forEach(t => {
          if (!map[t.categoria]) map[t.categoria] = { suma: 0, n: 0 };
          map[t.categoria].suma += t.dias_promedio;
          map[t.categoria].n   += 1;
        });
      return Object.entries(map).map(([cat, { suma, n }]) => ({
        categoria: CAT_LABELS[cat] ?? cat,
        dias: +(suma / n).toFixed(1),
        fill: CAT_COLORS[cat] ?? '#94a3b8',
      }));
    }
    return (stats.tiempo_resolucion ?? [])
      .filter(t => !filtroCateg || t.categoria === filtroCateg)
      .map(t => ({
        categoria: CAT_LABELS[t.categoria] ?? t.categoria,
        dias: t.dias_promedio,
        fill: CAT_COLORS[t.categoria] ?? '#94a3b8',
      }));
  }, [stats, mesDesde, mesHasta, filtroCateg]);

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

  const abiertos   = stats.por_estado.find(e => e.estado === 'abierto')?.count ?? 0;
  const enProceso  = stats.por_estado.find(e => e.estado === 'en_proceso')?.count ?? 0;
  const resueltos  = stats.por_estado.find(e => e.estado === 'resuelto')?.count ?? 0;
  const cerrados   = stats.por_estado.find(e => e.estado === 'cerrado')?.count ?? 0;
  const finalizados = resueltos + cerrados;
  const tasaResolucion = stats.total > 0 ? Math.round((finalizados / stats.total) * 100) : 0;

  /* KPI dinámicos según filtroEstado */
  const sinResolverDisplay = !filtroEstado ? (abiertos + enProceso)
    : filtroEstado === 'abierto'    ? abiertos
    : filtroEstado === 'en_proceso' ? enProceso
    : 0;
  const finalizadosDisplay = !filtroEstado ? finalizados
    : filtroEstado === 'resuelto' ? resueltos
    : filtroEstado === 'cerrado'  ? cerrados
    : 0;

  /* indicadores derivados */
  const backlog           = abiertos + enProceso;
  const pctBacklog        = stats.total > 0 ? Math.round((backlog / stats.total) * 100) : 0;
  const promedioMensual   = mesData.length > 0 ? Math.round(mesData.reduce((s, d) => s + d.count, 0) / mesData.length) : 0;
  const tiempoGlobal      = tiempoData.length > 0
    ? (tiempoData.reduce((s, d) => s + d.dias, 0) / tiempoData.length).toFixed(1)
    : null;
  const categoriaPrincipal = [...(stats.por_categoria ?? [])].sort((a, b) => b.count - a.count)[0] ?? null;

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
        <TicketsTable tickets={panel.tickets} />
      </DetailPanel>

      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-slate-900">Análisis de Tickets</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-7">Volumen, categorías y tiempos de resolución de soporte</p>
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
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Categoría</label>
              <select value={filtroCateg} onChange={e => setFiltroCateg(e.target.value)} className={selectCls}>
                <option value="">Todas</option>
                {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Estado</label>
              <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
              Mostrando {mesData.length} mes{mesData.length !== 1 ? 'es' : ''} · {totalPeriodo} tickets en el período
            </p>
          )}
        </div>
      </div>

      <main className="flex-1 py-6 px-6 lg:px-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={ClipboardList}
            value={filtrosActivos ? totalPeriodo : stats.total}
            label={filtrosActivos ? 'Tickets en período' : 'Total tickets'}
            color="bg-indigo-500"
            onClick={() => openPanel('Todos los tickets')} />
          <KpiCard icon={AlertCircle}
            value={sinResolverDisplay}
            label="Sin resolver"
            color="bg-amber-500"
            sub={filtroEstado ? `filtro: ${ESTADO_LABELS[filtroEstado]}` : undefined}
            onClick={() => {
              const estados = filtroEstado ? [filtroEstado] : ['abierto', 'en_proceso'];
              openPanel('Sin resolver', estados);
            }} />
          <KpiCard icon={CheckCircle}
            value={finalizadosDisplay}
            label="Resueltos / Cerrados"
            color="bg-emerald-500"
            sub={filtroEstado ? `filtro: ${ESTADO_LABELS[filtroEstado]}` : undefined}
            onClick={() => {
              const estados = filtroEstado ? [filtroEstado] : ['resuelto', 'cerrado'];
              openPanel('Resueltos / Cerrados', estados);
            }} />
          <KpiCard icon={Clock}
            value={`${tasaResolucion}%`}
            label="Tasa de resolución"
            color="bg-violet-500"
            sub={filtrosActivos ? 'estado actual del sistema' : undefined}
            onClick={() => openPanel('Todos los tickets')} />
        </div>

        {/* ── Indicadores derivados ─────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Indicadores derivados</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              label="Backlog activo"
              value={backlog}
              sub={`${pctBacklog}% del total aún sin cerrar`}
              bar={100 - pctBacklog}
              onClick={() => openPanel('Backlog activo', ['abierto', 'en_proceso'])}
            />
            <InsightCard
              label="Tasa de cierre"
              value={`${tasaResolucion}%`}
              sub={`${finalizados} tickets finalizados`}
              bar={tasaResolucion}
              onClick={() => openPanel('Resueltos / Cerrados', ['resuelto', 'cerrado'])}
            />
            <InsightCard
              label="Promedio mensual"
              value={promedioMensual}
              sub="tickets por mes (período filtrado)"
              onClick={() => openPanel('Todos los tickets')}
            />
            <InsightCard
              label="Tiempo promedio global"
              value={tiempoGlobal ? `${tiempoGlobal} días` : '—'}
              sub="promedio entre categorías resueltas"
              onClick={() => openPanel('Resueltos / Cerrados', ['resuelto', 'cerrado'])}
            />
          </div>
          {categoriaPrincipal && (
            <p className="text-xs text-slate-400 mt-3">
              Categoría más frecuente: <span className="font-semibold text-slate-600">{CAT_LABELS[categoriaPrincipal.categoria] ?? categoriaPrincipal.categoria}</span>
              {' '}({categoriaPrincipal.count} tickets · {stats.total > 0 ? Math.round(categoriaPrincipal.count / stats.total * 100) : 0}% del total)
            </p>
          )}
        </div>

        {/* Tickets por mes */}
        <ChartCard title={filtrosActivos ? `Tickets por mes (período filtrado · ${totalPeriodo} total)` : 'Tickets por mes'}>
          {mesData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin datos en el período seleccionado</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Tickets" stroke="#6366f1"
                  strokeWidth={2} fill="url(#gradTickets)" dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Variación mes a mes ──────────────────────────────────── */}
        {crecimientoData.length > 1 && (
          <ChartCard title="Variación mensual · tickets (barras) y crecimiento % vs mes anterior (línea)">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={crecimientoData} margin={{ top: 4, right: 44, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar yAxisId="left" dataKey="count" name="Tickets" fill="#6366f1" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="pct" name="Variación %" stroke="#f59e0b"
                  strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Estado y Categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title={filtroEstado ? `Estado: ${ESTADO_LABELS[filtroEstado]}` : (mesDesde || mesHasta ? 'Distribución por estado (período filtrado)' : 'Distribución por estado')}>
            {estadoPieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={estadoPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {estadoPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Tickets']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title={filtrosActivos ? 'Distribución por categoría (período filtrado)' : 'Distribución por categoría'}
            note={filtroEstado ? 'El desglose por categoría no incluye dimensión de estado — el filtro de estado no aplica a esta vista' : undefined}>
            {catPieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {catPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Tickets']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Tickets por categoría y mes */}
        {catMesData.length > 0 && (
          <ChartCard title="Tickets por categoría y mes"
            note={filtroEstado ? 'El desglose por categoría no incluye dimensión de estado — el filtro de estado no aplica a esta vista' : undefined}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={catMesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                {catsActivas.map(cat => (
                  <Bar key={cat} dataKey={cat} name={CAT_LABELS[cat]} fill={CAT_COLORS[cat]} stackId="cat" />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Tiempo de resolución */}
        {tiempoData.length > 0 && (
          <ChartCard title="Tiempo promedio de resolución por categoría (días hasta cierre)"
            note={filtroEstado ? 'Siempre muestra tickets resueltos/cerrados — el filtro de estado no aplica aquí' : undefined}>
            <div className="space-y-4">
              {tiempoData.map(t => {
                const maxDias = Math.max(...tiempoData.map(d => d.dias), 1);
                const pct = Math.round((t.dias / maxDias) * 100);
                const nivel = t.dias <= 2 ? 'Rápido' : t.dias <= 5 ? 'Moderado' : 'Lento';
                const nivelColor = t.dias <= 2 ? 'text-emerald-600' : t.dias <= 5 ? 'text-amber-600' : 'text-rose-500';
                return (
                  <div key={t.categoria}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{t.categoria}</span>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold ${nivelColor}`}>{nivel}</span>
                        <span className="text-sm font-bold text-slate-900">{t.dias} días</span>
                      </div>
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: t.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {tiempoGlobal && (
              <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                Promedio global entre categorías: <span className="font-semibold text-slate-600">{tiempoGlobal} días</span>
              </p>
            )}
          </ChartCard>
        )}

        {/* Resumen estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Estado actual del sistema de soporte
            <span className="text-[10px] font-normal text-slate-400 ml-2 italic">· Snapshot global — no varía con filtros</span>
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Abiertos',   count: abiertos,  color: 'bg-indigo-50 border-indigo-100 text-indigo-700' },
              { label: 'En proceso', count: enProceso, color: 'bg-amber-50 border-amber-100 text-amber-700' },
              { label: 'Resueltos',  count: resueltos, color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { label: 'Cerrados',   count: cerrados,  color: 'bg-slate-50 border-slate-100 text-slate-600' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`border rounded-xl px-4 py-3 ${color}`}>
                <p className="text-xs font-medium opacity-70">{label}</p>
                <p className="text-2xl font-bold mt-0.5">{count}</p>
                {stats.total > 0 && (
                  <p className="text-xs opacity-60 mt-0.5">{Math.round((count / stats.total) * 100)}% del total</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default AnalisisTicketsPage;
