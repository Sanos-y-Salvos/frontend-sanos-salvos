import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, AlertCircle, Loader2, X, SlidersHorizontal } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { ticketService } from '../../../services/ticketService';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Alert from '../../../components/ui/Alert';

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

const KpiCard = ({ icon: Icon, value, label, color, sub }: {
  icon: React.ElementType; value: string | number; label: string; color: string; sub?: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const ChartCard = ({ title, children, className = '' }: {
  title: string; children: React.ReactNode; className?: string;
}) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
    <p className="text-sm font-semibold text-slate-700 mb-4">{title}</p>
    {children}
  </motion.div>
);

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

  const allMonths = useMemo(
    () => [...new Set((stats?.por_mes ?? []).map(d => d.mes))].sort(),
    [stats],
  );

  const filtrosActivos = !!(mesDesde || mesHasta || filtroCateg || filtroEstado);
  const resetFiltros = () => { setMesDesde(''); setMesHasta(''); setFiltroCateg(''); setFiltroEstado(''); };

  /* mes total (re-agrega desde categoría si hay filtro de categoría) */
  const mesData = useMemo(() => {
    if (!stats) return [];
    if (filtroCateg) {
      const map: Record<string, number> = {};
      (stats.por_mes_categoria ?? [])
        .filter(d => inRange(d.mes, mesDesde, mesHasta) && d.categoria === filtroCateg)
        .forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    return (stats.por_mes ?? [])
      .filter(d => inRange(d.mes, mesDesde, mesHasta))
      .map(d => ({ mes: fmtMes(d.mes), count: d.count }));
  }, [stats, mesDesde, mesHasta, filtroCateg]);

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

  /* pie estado (no varía con filtros — es estado actual) */
  const estadoPieData = useMemo(() => {
    if (!stats) return [];
    return stats.por_estado.filter(e => e.count > 0 && (!filtroEstado || e.estado === filtroEstado))
      .map(e => ({ name: ESTADO_LABELS[e.estado] ?? e.estado, value: e.count, fill: ESTADO_COLORS[e.estado] ?? '#94a3b8' }));
  }, [stats, filtroEstado]);

  const totalPeriodo = useMemo(() => mesData.reduce((s, d) => s + d.count, 0), [mesData]);
  const catsActivas  = filtroCateg ? [filtroCateg] : ['problema_tecnico', 'reporte_abuso', 'otro'];

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-slate-50"><Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" /><p className="text-sm">Cargando análisis...</p>
      </div><Footer /></div>
  );
  if (error || !stats) return (
    <div className="min-h-screen flex flex-col bg-slate-50"><Navbar />
      <div className="flex-1 px-6 py-10"><Alert variant="error">{error || 'Sin datos'}</Alert></div><Footer /></div>
  );

  const abiertos   = stats.por_estado.find(e => e.estado === 'abierto')?.count ?? 0;
  const enProceso  = stats.por_estado.find(e => e.estado === 'en_proceso')?.count ?? 0;
  const resueltos  = stats.por_estado.find(e => e.estado === 'resuelto')?.count ?? 0;
  const cerrados   = stats.por_estado.find(e => e.estado === 'cerrado')?.count ?? 0;
  const finalizados = resueltos + cerrados;
  const tasaResolucion = stats.total > 0 ? Math.round((finalizados / stats.total) * 100) : 0;

  const tiempoData = (stats.tiempo_resolucion ?? [])
    .filter(t => !filtroCateg || t.categoria === filtroCateg)
    .map(t => ({
      categoria: CAT_LABELS[t.categoria] ?? t.categoria,
      dias: t.dias_promedio,
      fill: CAT_COLORS[t.categoria] ?? '#94a3b8',
    }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

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
              <select value={mesDesde} onChange={e => setMesDesde(e.target.value)} className={selectCls}>
                <option value="">Inicio</option>
                {allMonths.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Hasta</label>
              <select value={mesHasta} onChange={e => setMesHasta(e.target.value)} className={selectCls}>
                <option value="">Hoy</option>
                {allMonths.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
              </select>
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
              <button onClick={resetFiltros}
                className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:text-rose-600 border border-rose-200 bg-rose-50 px-3 py-2 rounded-xl transition-all self-end">
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
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
          <KpiCard icon={ClipboardList} value={stats.total}            label="Total tickets"          color="bg-indigo-500"
            sub={filtrosActivos ? `${totalPeriodo} en el período` : undefined} />
          <KpiCard icon={AlertCircle}   value={abiertos + enProceso}   label="Sin resolver"           color="bg-amber-500" />
          <KpiCard icon={CheckCircle}   value={finalizados}            label="Resueltos / Cerrados"   color="bg-emerald-500" />
          <KpiCard icon={Clock}         value={`${tasaResolucion}%`}   label="Tasa de resolución"     color="bg-violet-500" />
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

        {/* Estado y Categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title={filtroEstado ? `Estado: ${ESTADO_LABELS[filtroEstado]}` : 'Distribución por estado'}>
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

          <ChartCard title={filtrosActivos ? 'Distribución por categoría (período filtrado)' : 'Distribución por categoría'}>
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
          <ChartCard title="Tickets por categoría y mes">
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
          <ChartCard title="Tiempo promedio de resolución por categoría (días)">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={tiempoData} margin={{ top: 4, right: 40, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="categoria" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} unit=" d" />
                <Tooltip formatter={(v: number) => [`${v} días`, 'Promedio']} />
                <Bar dataKey="dias" name="Días promedio" radius={[4, 4, 0, 0]}>
                  {tiempoData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Resumen estado */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-slate-700 mb-3">Estado actual del sistema de soporte</p>
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
