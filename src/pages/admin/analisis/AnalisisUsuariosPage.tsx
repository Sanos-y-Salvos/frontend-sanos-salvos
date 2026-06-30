import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, UserCheck, Building2, Loader2, X, SlidersHorizontal } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { userService } from '../../../services/userService';
import type { User } from '../../../types';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Alert from '../../../components/ui/Alert';
import DetailPanel from '../../../components/admin/DetailPanel';

type Stats = Awaited<ReturnType<typeof userService.getEstadisticas>>;

/* ── paletas ──────────────────────────────────────────────────────────── */
const ROL_COLORS: Record<string, string> = {
  ciudadano: '#6366f1', veterinaria: '#10b981', municipalidad: '#8b5cf6',
  moderador: '#f59e0b', administrador: '#f97316', superadmin: '#ef4444',
};
const TIPO_COLORS = ['#6366f1', '#10b981'];
const rolLabel: Record<string, string> = {
  ciudadano: 'Ciudadano', veterinaria: 'Veterinaria', municipalidad: 'Municipalidad',
  moderador: 'Moderador', administrador: 'Administrador', superadmin: 'Super Admin',
};
const ROL_BADGE: Record<string, string> = {
  ciudadano:     'bg-blue-100 text-blue-700',
  veterinaria:   'bg-emerald-100 text-emerald-700',
  municipalidad: 'bg-purple-100 text-purple-700',
  moderador:     'bg-amber-100 text-amber-700',
  administrador: 'bg-orange-100 text-orange-700',
  superadmin:    'bg-rose-100 text-rose-700',
};

/* ── helpers ──────────────────────────────────────────────────────────── */
const fmtMes = (mes: string) => {
  const [y, m] = mes.split('-');
  return `${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+m-1]} ${y.slice(2)}`;
};
const fmtFecha = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const inRange = (mes: string, desde: string, hasta: string) =>
  (!desde || mes >= desde) && (!hasta || mes <= hasta);
const inDateRange = (iso?: string, desde?: string, hasta?: string) => {
  if (!iso || (!desde && !hasta)) return true;
  const ym = iso.slice(0, 7);
  return (!desde || ym >= desde) && (!hasta || ym <= hasta);
};
const getNombre = (u: User) =>
  u.ciudadano
    ? `${u.ciudadano.primer_nombre} ${u.ciudadano.apellido_paterno}`
    : u.institucion?.razon_social ?? u.email;

/* ── sub-components ───────────────────────────────────────────────────── */
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

const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  ) : null;

/* ── tabla de usuarios en el panel ───────────────────────────────────── */
const UsuariosTable = ({ usuarios }: { usuarios: User[] }) => {
  if (!usuarios.length)
    return <p className="text-sm text-slate-400 text-center py-16">No hay registros para mostrar.</p>;
  return (
    <div className="px-6 py-4">
      <p className="text-xs text-slate-400 mb-3">{usuarios.length} registro{usuarios.length !== 1 ? 's' : ''}</p>
      <div className="space-y-2">
        {usuarios.map(u => (
          <div key={u.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{getNombre(u)}</p>
              <p className="text-xs text-slate-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROL_BADGE[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                {rolLabel[u.rol] ?? u.rol}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {u.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:block">{fmtFecha(u.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const selectCls = 'border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all';
const inRange2  = inRange;

/* ── panel state ──────────────────────────────────────────────────────── */
interface PanelState { open: boolean; title: string; subtitle: string; usuarios: User[]; loading: boolean; }
const PANEL_CLOSED: PanelState = { open: false, title: '', subtitle: '', usuarios: [], loading: false };

/* ── página ───────────────────────────────────────────────────────────── */
const AnalisisUsuariosPage = () => {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [panel,   setPanel]   = useState<PanelState>(PANEL_CLOSED);

  /* filtros */
  const [mesDesde,   setMesDesde]   = useState('');
  const [mesHasta,   setMesHasta]   = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroRol,  setFiltroRol]  = useState('');

  useEffect(() => {
    userService.getEstadisticas()
      .then(setStats)
      .catch(() => setError('Error al cargar los datos'))
      .finally(() => setLoading(false));
  }, []);

  const filtrosActivos = !!(mesDesde || mesHasta || filtroTipo || filtroRol);
  const filtrosCount   = [mesDesde, mesHasta, filtroTipo, filtroRol].filter(Boolean).length;
  const resetFiltros = () => { setMesDesde(''); setMesHasta(''); setFiltroTipo(''); setFiltroRol(''); };

  /* ── abrir panel ─────────────────────────────────────────────────── */
  const openPanel = useCallback(async (title: string, overrides?: { is_active?: boolean; tipo?: string; rol?: string }) => {
    setPanel({ open: true, title, subtitle: '', usuarios: [], loading: true });
    try {
      const filtros: { rol?: string; is_active?: boolean } = {};
      const rol  = overrides?.rol  ?? (filtroRol  || undefined);
      const tipo = overrides?.tipo ?? (filtroTipo || undefined);
      if (rol)                          filtros.rol       = rol;
      if (overrides?.is_active != null) filtros.is_active = overrides.is_active;

      let todos = await userService.listarUsuarios(filtros);

      /* filtro de tipo (ciudadano/institucion) — client-side */
      if (tipo) todos = todos.filter(u => u.tipo === tipo);

      /* filtro de fecha — client-side por created_at */
      if (mesDesde || mesHasta)
        todos = todos.filter(u => inDateRange(u.created_at, mesDesde, mesHasta));

      const sub = [
        mesDesde && `desde ${mesDesde}`, mesHasta && `hasta ${mesHasta}`,
        rol && rolLabel[rol], tipo,
        overrides?.is_active === true ? 'solo activos' : overrides?.is_active === false ? 'solo inactivos' : undefined,
      ].filter(Boolean).join(' · ');

      setPanel(p => ({ ...p, loading: false, usuarios: todos, subtitle: sub }));
    } catch {
      setPanel(p => ({ ...p, loading: false }));
    }
  }, [filtroRol, filtroTipo, mesDesde, mesHasta]);

  /* datos filtrados */
  const mesData = useMemo(() => {
    if (!stats) return [];
    if (filtroRol) {
      const map: Record<string, number> = {};
      (stats.por_mes_rol ?? [])
        .filter(d => inRange2(d.mes, mesDesde, mesHasta) && d.rol === filtroRol)
        .forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    if (filtroTipo) {
      const map: Record<string, number> = {};
      (stats.por_mes_tipo ?? [])
        .filter(d => inRange2(d.mes, mesDesde, mesHasta) && d.tipo === filtroTipo)
        .forEach(d => { map[d.mes] = (map[d.mes] ?? 0) + d.count; });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
        .map(([mes, count]) => ({ mes: fmtMes(mes), count }));
    }
    return (stats.por_mes ?? [])
      .filter(d => inRange2(d.mes, mesDesde, mesHasta))
      .map(d => ({ mes: fmtMes(d.mes), count: d.count }));
  }, [stats, mesDesde, mesHasta, filtroTipo, filtroRol]);

  const tipoAreaData = useMemo(() => {
    if (!stats) return [];
    const tipos = filtroTipo ? [filtroTipo] : ['ciudadano', 'institucion'];
    const rows = (stats.por_mes_tipo ?? [])
      .filter(d => inRange2(d.mes, mesDesde, mesHasta) && (!filtroTipo || d.tipo === filtroTipo));
    const map: Record<string, Record<string, number>> = {};
    rows.forEach(({ mes, tipo, count }) => {
      if (!map[mes]) map[mes] = {};
      map[mes][tipo] = count;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({ mes: fmtMes(mes), ...Object.fromEntries(tipos.map(t => [t, vals[t] ?? 0])) }));
  }, [stats, mesDesde, mesHasta, filtroTipo]);

  const rolAreaData = useMemo(() => {
    if (!stats) return [];
    const roles = filtroRol ? [filtroRol] : ['ciudadano','veterinaria','municipalidad','moderador'];
    const rows = (stats.por_mes_rol ?? [])
      .filter(d => inRange2(d.mes, mesDesde, mesHasta) && (!filtroRol || d.rol === filtroRol));
    const map: Record<string, Record<string, number>> = {};
    rows.forEach(({ mes, rol, count }) => {
      if (!map[mes]) map[mes] = {};
      map[mes][rol] = count;
    });
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b))
      .map(([mes, vals]) => ({ mes: fmtMes(mes), ...Object.fromEntries(roles.map(r => [r, vals[r] ?? 0])) }));
  }, [stats, mesDesde, mesHasta, filtroRol]);

  const rolPieData = useMemo(() => {
    if (!stats) return [];
    let source: { rol: string; count: number }[];
    if (mesDesde || mesHasta) {
      const map: Record<string, number> = {};
      (stats.por_mes_rol ?? [])
        .filter(r => inRange2(r.mes, mesDesde, mesHasta))
        .forEach(r => { map[r.rol] = (map[r.rol] ?? 0) + r.count; });
      source = Object.entries(map).map(([rol, count]) => ({ rol, count }));
    } else {
      source = stats.por_rol;
    }
    return source
      .filter(r => r.count > 0 && (!filtroRol || r.rol === filtroRol))
      .map(r => ({ name: rolLabel[r.rol] ?? r.rol, value: r.count, fill: ROL_COLORS[r.rol] ?? '#94a3b8' }));
  }, [stats, mesDesde, mesHasta, filtroRol]);

  const totalPeriodo = useMemo(() => mesData.reduce((s, d) => s + d.count, 0), [mesData]);
  const institucionesPeriodo = useMemo(
    () => tipoAreaData.reduce((s, d) => s + ((d as any).institucion ?? 0), 0),
    [tipoAreaData],
  );

  const crecimientoData = useMemo(() =>
    mesData.map((d, i) => ({
      mes: d.mes, count: d.count,
      pct: i === 0 || mesData[i - 1].count === 0
        ? null
        : +((d.count - mesData[i - 1].count) / mesData[i - 1].count * 100).toFixed(1),
    })),
  [mesData]);

  const acumuladoData = useMemo(() => {
    let acum = 0;
    return (stats?.por_mes ?? []).map(d => { acum += d.count; return { mes: fmtMes(d.mes), total: acum }; });
  }, [stats]);

  if (loading) return (
    <div className="min-h-screen flex flex-col admin-glass"><Navbar />
      <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" /><p className="text-sm">Cargando análisis...</p>
      </div><Footer />
    </div>
  );
  if (error || !stats) return (
    <div className="min-h-screen flex flex-col admin-glass"><Navbar />
      <div className="flex-1 px-6 py-10"><Alert variant="error">{error || 'Sin datos'}</Alert></div><Footer />
    </div>
  );

  const pct              = stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  const regionData       = (stats.por_region ?? []).filter(r => r.region).slice(0, 10).map(r => ({ region: r.region || 'Sin región', count: r.count }));
  const comunaData       = (stats.top_comunas ?? []).filter(c => c.comuna).slice(0, 10).map(c => ({ comuna: c.comuna || 'Sin comuna', count: c.count }));
  const tiposActivos     = filtroTipo ? [filtroTipo] : ['ciudadano', 'institucion'];
  const rolesActivos     = filtroRol ? [filtroRol] : ['ciudadano','veterinaria','municipalidad','moderador'];
  const tasaActivacion   = stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  const inactivos        = stats.total - stats.activos;
  const meses            = stats.por_mes ?? [];
  const promedioMensual  = meses.length > 0 ? Math.round(stats.total / meses.length) : 0;
  const mesPico          = [...meses].sort((a, b) => b.count - a.count)[0] ?? null;
  const topRegion        = [...(stats.por_region ?? [])].sort((a, b) => b.count - a.count)[0] ?? null;
  const pctTopRegion     = topRegion && stats.total > 0 ? Math.round((topRegion.count / stats.total) * 100) : 0;
  const institucionesTotal = (stats.por_tipo ?? []).find(t => t.tipo === 'institucion')?.count ?? 0;

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
        <UsuariosTable usuarios={panel.usuarios} />
      </DetailPanel>

      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-5">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-slate-900">Análisis de Usuarios</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 ml-7">Evolución, distribución y comportamiento de registros</p>
        </div>

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
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Tipo de cuenta</label>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                <option value="ciudadano">Ciudadano</option>
                <option value="institucion">Institución</option>
              </select>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Rol</label>
              <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className={selectCls}>
                <option value="">Todos</option>
                {Object.entries(rolLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
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
              Mostrando {mesData.length} mes{mesData.length !== 1 ? 'es' : ''} · {totalPeriodo} registros en el período
            </p>
          )}
        </div>
      </div>

      <main className="flex-1 py-6 px-6 lg:px-8 space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard icon={Users}
            value={filtrosActivos ? totalPeriodo : stats.total}
            label={filtrosActivos ? 'Registros en período' : 'Total usuarios'}
            color="bg-indigo-500"
            onClick={() => openPanel('Todos los usuarios')} />
          <KpiCard icon={UserCheck}
            value={stats.activos}
            label="Cuentas activas"
            color="bg-emerald-500"
            sub={filtrosActivos ? 'estado actual del sistema' : undefined}
            onClick={() => openPanel('Usuarios activos', { is_active: true })} />
          <KpiCard icon={TrendingUp}
            value={`${pct}%`}
            label="Tasa de actividad"
            color="bg-violet-500"
            sub={filtrosActivos ? 'estado actual del sistema' : undefined}
            onClick={() => openPanel('Activos vs inactivos')} />
          <KpiCard icon={Building2}
            value={filtrosActivos ? institucionesPeriodo : institucionesTotal}
            label={filtrosActivos ? 'Instituciones en período' : 'Instituciones'}
            color="bg-amber-500"
            onClick={() => openPanel('Instituciones', { tipo: 'institucion' })} />
        </div>

        {/* Indicadores derivados */}
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Indicadores derivados</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <InsightCard
              label="Tasa de activación"
              value={`${tasaActivacion}%`}
              sub={`${stats.activos} activos de ${stats.total} registrados`}
              bar={tasaActivacion}
              onClick={() => openPanel('Usuarios activos', { is_active: true })}
            />
            <InsightCard
              label="Cuentas inactivas"
              value={inactivos}
              sub={inactivos > 0 ? `${100 - tasaActivacion}% del total` : 'Ninguna inactiva'}
              onClick={() => openPanel('Usuarios inactivos', { is_active: false })}
            />
            <InsightCard
              label="Promedio mensual"
              value={promedioMensual}
              sub="nuevos usuarios por mes (histórico)"
              onClick={() => openPanel('Todos los usuarios')}
            />
            <InsightCard
              label="Mes pico de registros"
              value={mesPico ? fmtMes(mesPico.mes) : '—'}
              sub={mesPico ? `${mesPico.count} nuevos usuarios` : undefined}
            />
          </div>
          {topRegion && (
            <p className="text-xs text-slate-400 mt-3">
              Región con más usuarios: <span className="font-semibold text-slate-600">{topRegion.region}</span>
              {' '}({topRegion.count} usuarios · {pctTopRegion}% del total)
            </p>
          )}
        </div>

        {/* Registros por mes */}
        <ChartCard title={filtrosActivos ? `Registros por mes (período filtrado · ${totalPeriodo} total)` : 'Registros por mes'}>
          {mesData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Sin datos en el período seleccionado</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={mesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Registros" stroke="#6366f1"
                  strokeWidth={2} fill="url(#gradUser)" dot={{ r: 3, fill: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {crecimientoData.length > 1 && (
          <ChartCard title="Variación mensual · registros (barras) y crecimiento % vs mes anterior (línea)">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={crecimientoData} margin={{ top: 4, right: 44, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 10, fill: '#f59e0b' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine yAxisId="right" y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                <Bar yAxisId="left" dataKey="count" name="Registros" fill="#6366f1" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="pct" name="Variación %" stroke="#f59e0b"
                  strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} connectNulls={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {acumuladoData.length > 1 && (
          <ChartCard title="Crecimiento acumulado de usuarios registrados (histórico completo)" note="Histórico completo — no varía con el período ni los filtros seleccionados">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={acumuladoData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAcum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total acumulado" stroke="#10b981"
                  strokeWidth={2} fill="url(#gradAcum)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Ciudadanos vs Instituciones por mes"
            note={filtroRol ? 'El desglose por tipo no incluye dimensión de rol — el filtro de rol no aplica a esta vista' : undefined}>
            {tipoAreaData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos en el período seleccionado</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tipoAreaData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  {tiposActivos.map((t, i) => (
                    <Area key={t} type="monotone" dataKey={t}
                      name={t === 'ciudadano' ? 'Ciudadano' : 'Institución'}
                      stroke={TIPO_COLORS[i % TIPO_COLORS.length]}
                      fill={TIPO_COLORS[i % TIPO_COLORS.length]}
                      fillOpacity={0.15} strokeWidth={2} dot={false} stackId="tipo" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title={filtrosActivos ? 'Distribución por rol (período filtrado)' : 'Distribución por rol'}
            note={filtroTipo ? 'El desglose por rol no incluye dimensión de tipo — el filtro de tipo no aplica a esta vista' : undefined}>
            {rolPieData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-10">Sin datos</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={rolPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" nameKey="name" paddingAngle={2}>
                    {rolPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Usuarios']} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {rolAreaData.length > 0 && (
          <ChartCard title="Evolución de roles por mes"
            note={filtroTipo ? 'El desglose por rol no incluye dimensión de tipo — el filtro de tipo no aplica a esta vista' : undefined}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={rolAreaData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                {rolesActivos.map(r => (
                  <Area key={r} type="monotone" dataKey={r} name={rolLabel[r]}
                    stroke={ROL_COLORS[r]} fill={ROL_COLORS[r]}
                    fillOpacity={0.12} strokeWidth={2} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Usuarios por región" note="Datos totales — no varía con filtros">
            {regionData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos de región</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, regionData.length * 32)}>
                <BarChart data={regionData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="region" tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Usuarios" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Top 10 comunas" note="Datos totales — no varía con filtros">
            {comunaData.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Sin datos de comuna</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, comunaData.length * 32)}>
                <BarChart data={comunaData} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="comuna" tick={{ fontSize: 10, fill: '#64748b' }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Usuarios" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default AnalisisUsuariosPage;
