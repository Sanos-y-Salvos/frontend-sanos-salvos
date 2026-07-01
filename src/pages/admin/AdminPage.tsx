import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, TicketCheck, Loader2, MapPin, Building2,
  UserCircle, Tag, Activity, TrendingUp, RefreshCw,
  PawPrint, Search, CheckCircle2, BarChart2, ShieldAlert, ArrowRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { ticketService } from '../../services/ticketService';
import { getEstadisticasReportes, listarReportes, type EstadisticasReportes } from '../../services/reporteService';
import { regionService } from '../../services/regionService';
import type { User, Reporte, Ticket } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import DetailPanel from '../../components/admin/DetailPanel';

/* ── Paletas ─────────────────────────────────────────────────────────── */
const ROL_COLOR: Record<string, string> = {
  ciudadano:     'bg-blue-100 text-blue-700 border border-blue-200',
  veterinaria:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
  municipalidad: 'bg-purple-100 text-purple-700 border border-purple-200',
  moderador:     'bg-amber-100 text-amber-700 border border-amber-200',
  administrador: 'bg-orange-100 text-orange-700 border border-orange-200',
  superadmin:    'bg-rose-100 text-rose-700 border border-rose-200',
};

const COLORS = {
  tipoUsuario:    ['#3b82f6', '#9333ea'],
  tipoInstitucion:['#10b981', '#9333ea'],
  rol:            '#64748b',
  ticketEstado:   ['#06b6d4', '#f59e0b', '#10b981', '#94a3b8'],
  ticketCategoria:['#f43f5e', '#f59e0b', '#64748b'],
  mascotaTipo:    ['#f43f5e', '#10b981'],
  mascotaEstado:  ['#f59e0b', '#10b981', '#f43f5e', '#94a3b8'],
  mascotaTamanio: ['#60a5fa', '#fbbf24', '#34d399'],
  especie:        '#6366f1',
  region:         '#0ea5e9',
  comuna:         '#8b5cf6',
};

/* ── Tooltip personalizado ───────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2">
      <p className="text-xs font-semibold text-slate-700">{payload[0].name}</p>
      <p className="text-sm font-bold text-slate-900">{payload[0].value.toLocaleString('es-CL')}</p>
    </div>
  );
};

/* ── KPI card ────────────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, color, onClick }: {
  label: string; value: number | string; icon: React.ElementType; color: string; onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 transition-all duration-150 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200 active:scale-[0.99]' : ''}`}
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-2xl font-display font-bold text-slate-900 leading-none">{typeof value === 'number' ? value.toLocaleString('es-CL') : value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
    {onClick && <span className="text-[10px] text-slate-300 flex-shrink-0">Ver →</span>}
  </div>
);

/* ── Card contenedor ─────────────────────────────────────────────────── */
const ChartCard = ({ title, icon: Icon, delay = 0, children, to }: {
  title: string; icon: React.ElementType; delay?: number; children: React.ReactNode; to?: string;
}) => {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`bg-white rounded-2xl border shadow-sm p-5 transition-all duration-200 ${
        to
          ? 'border-slate-100 hover:border-brand-200 hover:shadow-md cursor-pointer'
          : 'border-slate-100'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        {to && <ArrowRight className="w-3 h-3 text-slate-300 ml-auto group-hover:text-brand-400 transition-colors" />}
      </div>
      {children}
    </motion.div>
  );
  if (to) return <Link to={to} className="block group">{inner}</Link>;
  /* c8 ignore next */
  return inner;
};

/* ── Donut chart ─────────────────────────────────────────────────────── */
const DonutChart = ({ data, colors }: {
  data: { name: string; value: number }[];
  colors: string[];
}) => {
  const hasData = data.some(d => d.value > 0);
  if (!hasData) return <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%" cy="45%"
          innerRadius={58} outerRadius={88}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} stroke="none" />)}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          formatter={(value) => <span style={{ color: '#475569' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/* ── Horizontal bar chart ────────────────────────────────────────────── */
const HBarChart = ({ data, color, labelWidth = 100 }: {
  data: { name: string; value: number }[];
  color: string;
  labelWidth?: number;
}) => {
  if (!data.length) return <p className="text-xs text-slate-400 text-center py-8">Sin datos</p>;
  return (
    <ResponsiveContainer width="100%" height={Math.max(data.length * 38, 80)}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 36, top: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={labelWidth}
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} maxBarSize={20}>
          <LabelList dataKey="value" position="right" style={{ fontSize: '11px', fill: '#475569', fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* ── Sección header ──────────────────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, title, meta, href }: {
  icon: React.ElementType; title: string; meta?: string; href?: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
    <div className="ml-auto flex items-center gap-3">
      {meta && <span className="text-xs text-slate-400 font-medium">{meta}</span>}
      {href && (
        <Link to={href} className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors">
          Ver análisis
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  </div>
);

/* ── Helpers tabla panel ────────────────────────────────────────────── */
const ROL_BADGE_DASH: Record<string, string> = {
  ciudadano: 'bg-blue-100 text-blue-700', veterinaria: 'bg-emerald-100 text-emerald-700',
  municipalidad: 'bg-purple-100 text-purple-700', moderador: 'bg-amber-100 text-amber-700',
  administrador: 'bg-orange-100 text-orange-700', superadmin: 'bg-rose-100 text-rose-700',
};
const ROL_LBL: Record<string, string> = {
  ciudadano: 'Ciudadano', veterinaria: 'Veterinaria', municipalidad: 'Municipalidad',
  moderador: 'Moderador', administrador: 'Administrador', superadmin: 'Super Admin',
};
const TIPO_BADGE_DASH: Record<string, string> = {
  PERDIDA: 'bg-rose-100 text-rose-700', ENCONTRADA: 'bg-emerald-100 text-emerald-700',
};
const ESTADO_BADGE_DASH: Record<string, string> = {
  EN_BUSQUEDA: 'bg-amber-100 text-amber-700', RESUELTO: 'bg-emerald-100 text-emerald-700',
  ABANDONADO: 'bg-slate-100 text-slate-500', OCULTO: 'bg-slate-50 text-slate-400',
};
const ESTADO_LBL_DASH: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda', RESUELTO: 'Resuelto', ABANDONADO: 'Abandonado', OCULTO: 'Oculto',
};
const ESTADO_TK_BADGE: Record<string, string> = {
  abierto: 'bg-indigo-100 text-indigo-700', en_proceso: 'bg-amber-100 text-amber-700',
  resuelto: 'bg-emerald-100 text-emerald-700', cerrado: 'bg-slate-100 text-slate-500',
};
const ESTADO_TK_LBL: Record<string, string> = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};
const CAT_LBL: Record<string, string> = {
  problema_tecnico: 'Prob. técnico', reporte_abuso: 'Abuso', otro: 'Otro',
};
const fmtD = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';
const getNombreDash = (u: User) =>
  u.ciudadano ? `${u.ciudadano.primer_nombre} ${u.ciudadano.apellido_paterno}` : u.institucion?.razon_social ?? u.email;

type PanelKind = 'users' | 'reports' | 'tickets';
interface PanelState {
  open: boolean; title: string; loading: boolean;
  kind: PanelKind; items: (User | Reporte | Ticket)[];
}
const PANEL_CLOSED: PanelState = { open: false, title: '', loading: false, kind: 'users', items: [] };

/* ── Tipos ───────────────────────────────────────────────────────────── */
type UserStats   = Awaited<ReturnType<typeof userService.getEstadisticas>>;
type TicketStats = Awaited<ReturnType<typeof ticketService.getEstadisticas>>;

const ESTADO_LABEL: Record<string, string> = {
  abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto', cerrado: 'Cerrado',
};
const CATEGORIA_LABEL: Record<string, string> = {
  problema_tecnico: 'Prob. técnico', reporte_abuso: 'Abuso', otro: 'Otro',
};
const ESTADO_REPORTE_LABEL: Record<string, string> = {
  EN_BUSQUEDA: 'En búsqueda', RESUELTO: 'Resuelto', ABANDONADO: 'Abandonado', OCULTO: 'Oculto',
};

const QUICK_LINKS = [
  { icon: TicketCheck, label: 'Tickets',  desc: 'Gestionar soporte',       href: '/admin/tickets',           color: 'bg-amber-100', text: 'text-amber-600' },
  { icon: Users,       label: 'Usuarios', desc: 'Administrar cuentas',     href: '/admin/usuarios',          color: 'bg-blue-100',  text: 'text-blue-600'  },
  { icon: ShieldAlert, label: 'Mensajes', desc: 'Moderar conversaciones',  href: '/admin/mensajes',          color: 'bg-rose-100',  text: 'text-rose-600'  },
  { icon: BarChart2,   label: 'Análisis', desc: 'Estadísticas detalladas', href: '/admin/analisis/mascotas', color: 'bg-indigo-100',text: 'text-indigo-600'},
];

const QuickCard = ({ icon: Icon, label, desc, href, color, text }: {
  icon: React.ElementType; label: string; desc: string; href: string; color: string; text: string;
}) => (
  <Link
    to={href}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all duration-200 group cursor-pointer"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className={`w-5 h-5 ${text}`} strokeWidth={1.5} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
  </Link>
);

/* ── Página ──────────────────────────────────────────────────────────── */
const AdminPage = () => {
  const { user } = useAuth();

  const [userStats,    setUserStats]    = useState<UserStats | null>(null);
  const [ticketStats,  setTicketStats]  = useState<TicketStats | null>(null);
  const [reporteStats, setReporteStats] = useState<EstadisticasReportes | null>(null);
  const [regionNames,  setRegionNames]  = useState<Record<string, string>>({});
  const [loading,      setLoading]      = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState<Date>(new Date());
  const [panel,        setPanel]        = useState<PanelState>(PANEL_CLOSED);

  const cargar = async () => {
    setLoading(true);
    try {
      const [us, ts, rs, regiones] = await Promise.all([
        userService.getEstadisticas(),
        ticketService.getEstadisticas(),
        getEstadisticasReportes(),
        regionService.getRegiones(),
      ]);
      setUserStats(us);
      setTicketStats(ts);
      setReporteStats(rs);
      setRegionNames(Object.fromEntries(regiones.map(r => [r.codigo, r.nombre])));
      setLastUpdate(new Date());
    } catch { /* fallo silencioso */ }
    finally { setLoading(false); }
  };

  useEffect(() => { cargar(); }, []);

  const openUsersPanel = useCallback(async (title: string, filtros?: { is_active?: boolean; tipo?: string }) => {
    setPanel({ open: true, title, loading: true, kind: 'users', items: [] });
    try {
      let list = await userService.listarUsuarios(filtros?.is_active != null ? { is_active: filtros.is_active } : {});
      if (filtros?.tipo) list = list.filter(u => u.tipo === filtros.tipo);
      setPanel(p => ({ ...p, loading: false, items: list }));
    } catch { setPanel(p => ({ ...p, loading: false })); }
  }, []);

  const openReportsPanel = useCallback(async (title: string, filtros?: { tipo?: string; estado?: string }) => {
    setPanel({ open: true, title, loading: true, kind: 'reports', items: [] });
    try {
      const res = await listarReportes({ ...(filtros ?? {}), limit: 500 });
      setPanel(p => ({ ...p, loading: false, items: res.data }));
    } catch { setPanel(p => ({ ...p, loading: false })); }
  }, []);

  const openTicketsPanel = useCallback(async (title: string, estado?: string) => {
    setPanel({ open: true, title, loading: true, kind: 'tickets', items: [] });
    try {
      const list = await ticketService.listarTickets(estado);
      setPanel(p => ({ ...p, loading: false, items: list }));
    } catch { setPanel(p => ({ ...p, loading: false })); }
  }, []);

  /* ── Datos derivados ── */
  const ciudadanoCount   = userStats?.por_tipo.find(t => t.tipo === 'ciudadano')?.count   ?? 0;
  const institucionCount = userStats?.por_tipo.find(t => t.tipo === 'institucion')?.count ?? 0;
  const vetCount         = userStats?.por_tipo_institucion.find(t => t.tipo_institucion === 'veterinaria')?.count   ?? 0;
  const munCount         = userStats?.por_tipo_institucion.find(t => t.tipo_institucion === 'municipalidad')?.count ?? 0;

  const tipoUsuarioData    = [{ name: 'Ciudadanos', value: ciudadanoCount }, { name: 'Instituciones', value: institucionCount }];
  const tipoInstData       = [{ name: 'Veterinarias', value: vetCount }, { name: 'Municipalidades', value: munCount }];
  const rolData            = (userStats?.por_rol ?? []).map(r => ({ name: r.rol, value: r.count }));
  const regionData         = (userStats?.por_region ?? []).map(r => ({ name: regionNames[r.region] ?? r.region, value: r.count }));
  const comunasData        = (userStats?.top_comunas ?? []).map(c => ({ name: c.comuna, value: c.count }));
  const ticketEstadoData   = (ticketStats?.por_estado ?? []).map(e => ({ name: ESTADO_LABEL[e.estado] ?? e.estado, value: e.count }));
  const ticketCatData      = (ticketStats?.por_categoria ?? []).map(c => ({ name: CATEGORIA_LABEL[c.categoria] ?? c.categoria, value: c.count }));
  const mascotaTipoData    = [
    { name: 'Perdidas',    value: reporteStats?.por_tipo.find(t => t.tipo === 'PERDIDA')?.count    ?? 0 },
    { name: 'Encontradas', value: reporteStats?.por_tipo.find(t => t.tipo === 'ENCONTRADA')?.count ?? 0 },
  ];
  const mascotaEstadoData  = (reporteStats?.por_estado  ?? []).map(e => ({ name: ESTADO_REPORTE_LABEL[e.estado]  ?? e.estado,  value: e.count }));
  const mascotaTamanioData = (reporteStats?.por_tamanio ?? []).map(t => ({ name: t.tamanio.charAt(0) + t.tamanio.slice(1).toLowerCase(), value: t.count }));
  const especieData        = (reporteStats?.por_especie ?? []).map(e => ({
    name: e.especie.charAt(0) + e.especie.slice(1).toLowerCase(),
    value: e.count,
  }));

  const ROL_LABEL: Record<string, string> = {
    administrador: 'Administrador', superadmin: 'Super Administrador', moderador: 'Moderador',
  };

  /* ── Panel content ── */
  const renderPanelContent = () => {
    if (!panel.items.length)
      return <p className="text-sm text-slate-400 text-center py-16">No hay registros para mostrar.</p>;
    return (
      <div className="px-6 py-4">
        <p className="text-xs text-slate-400 mb-3">{panel.items.length} registro{panel.items.length !== 1 ? 's' : ''}</p>
        <div className="space-y-2">
          {panel.kind === 'users' && (panel.items as User[]).map(u => (
            <div key={u.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{getNombreDash(u)}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROL_BADGE_DASH[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                  {ROL_LBL[u.rol] ?? u.rol}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {u.is_active ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{fmtD(u.created_at)}</span>
              </div>
            </div>
          ))}
          {panel.kind === 'reports' && (panel.items as Reporte[]).map(r => (
            <div key={r.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.nombreMascota}</p>
                <p className="text-xs text-slate-400 truncate">{r.especie} · {r.color}{r.direccionReferencia ? ` · ${r.direccionReferencia}` : ''}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TIPO_BADGE_DASH[r.tipo] ?? 'bg-slate-100 text-slate-600'}`}>
                  {r.tipo === 'PERDIDA' ? 'Perdida' : 'Encontrada'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_BADGE_DASH[r.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                  {ESTADO_LBL_DASH[r.estado] ?? r.estado}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{fmtD(r.fechaPublicacion)}</span>
              </div>
            </div>
          ))}
          {panel.kind === 'tickets' && (panel.items as Ticket[]).map(t => (
            <div key={t.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{t.asunto || '(sin asunto)'}</p>
                <p className="text-xs text-slate-400 truncate">{CAT_LBL[t.categoria] ?? t.categoria}{t.email_contacto ? ` · ${t.email_contacto}` : ''}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_TK_BADGE[t.estado] ?? 'bg-slate-100 text-slate-500'}`}>
                  {ESTADO_TK_LBL[t.estado] ?? t.estado}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{fmtD(t.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col admin-glass">
      <Navbar />

      <DetailPanel
        isOpen={panel.open}
        onClose={() => setPanel(PANEL_CLOSED)}
        title={panel.title}
        loading={panel.loading}
      >
        {renderPanelContent()}
      </DetailPanel>

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Panel de Control</p>
            <h1 className="text-xl font-display font-bold text-slate-900 mt-0.5">
              Bienvenido{user?.ciudadano?.primer_nombre ? `, ${user.ciudadano.primer_nombre}` : ''}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROL_COLOR[user?.rol || ''] ?? 'bg-slate-100 text-slate-600'}`}>
                {ROL_LABEL[user?.rol || ''] || user?.rol}
              </span>
              {!loading && (
                <span className="text-xs text-slate-400">
                  · Actualizado {lastUpdate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={cargar}
            disabled={loading}
            className="flex items-center gap-2 border border-slate-200 text-slate-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      <main className="flex-1 py-6 px-6 lg:px-8">
        {loading && !userStats ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            <p className="text-sm">Cargando estadísticas...</p>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ══ ACCESOS RÁPIDOS ═══════════════════════════════════════ */}
            <section>
              <SectionHeader icon={Activity} title="Accesos rápidos" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {QUICK_LINKS.map((q) => <QuickCard key={q.href} {...q} />)}
              </div>
            </section>

            {/* ══ USUARIOS ══════════════════════════════════════════════ */}
            <section>
              <SectionHeader
                icon={Users}
                title="Usuarios"
                meta={userStats ? `${userStats.total.toLocaleString('es-CL')} registrados · ${userStats.activos.toLocaleString('es-CL')} activos` : undefined}
                href="/admin/analisis/usuarios"
              />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Total registrados" value={userStats?.total ?? 0}      icon={Users}      color="bg-slate-100 text-slate-600"    onClick={() => openUsersPanel('Todos los usuarios')} />
                <KpiCard label="Cuentas activas"   value={userStats?.activos ?? 0}    icon={Activity}   color="bg-emerald-50 text-emerald-600" onClick={() => openUsersPanel('Usuarios activos', { is_active: true })} />
                <KpiCard label="Ciudadanos"         value={ciudadanoCount}              icon={UserCircle} color="bg-blue-50 text-blue-600"       onClick={() => openUsersPanel('Ciudadanos', { tipo: 'ciudadano' })} />
                <KpiCard label="Instituciones"      value={institucionCount}            icon={Building2}  color="bg-purple-50 text-purple-600"   onClick={() => openUsersPanel('Instituciones', { tipo: 'institucion' })} />
              </div>

              {/* Gráficos fila 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <ChartCard title="Tipo de usuario" icon={UserCircle} delay={0.05} to="/admin/analisis/usuarios">
                  <DonutChart data={tipoUsuarioData} colors={COLORS.tipoUsuario} />
                </ChartCard>

                <ChartCard title="Tipo de institución" icon={Building2} delay={0.1} to="/admin/analisis/usuarios">
                  <DonutChart data={tipoInstData} colors={COLORS.tipoInstitucion} />
                </ChartCard>

                <ChartCard title="Por rol" icon={Tag} delay={0.15} to="/admin/analisis/usuarios">
                  <HBarChart data={rolData} color={COLORS.rol} labelWidth={90} />
                </ChartCard>
              </div>

              {/* Gráficos fila 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Por región" icon={MapPin} delay={0.2} to="/admin/analisis/usuarios">
                  <HBarChart data={regionData} color={COLORS.region} labelWidth={130} />
                </ChartCard>

                <ChartCard title="Top 10 comunas" icon={TrendingUp} delay={0.25} to="/admin/analisis/usuarios">
                  <HBarChart data={comunasData} color={COLORS.comuna} labelWidth={110} />
                </ChartCard>
              </div>
            </section>

            {/* ══ SOPORTE ═══════════════════════════════════════════════ */}
            <section>
              <SectionHeader
                icon={TicketCheck}
                title="Soporte"
                meta={ticketStats ? `${ticketStats.total.toLocaleString('es-CL')} tickets en total` : undefined}
                href="/admin/analisis/tickets"
              />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Total tickets"  value={ticketStats?.total ?? 0}
                  icon={TicketCheck} color="bg-slate-100 text-slate-600"
                  onClick={() => openTicketsPanel('Todos los tickets')} />
                <KpiCard label="Abiertos"
                  value={ticketStats?.por_estado.find(e => e.estado === 'abierto')?.count ?? 0}
                  icon={Activity} color="bg-indigo-50 text-indigo-600"
                  onClick={() => openTicketsPanel('Tickets abiertos', 'abierto')} />
                <KpiCard label="En proceso"
                  value={ticketStats?.por_estado.find(e => e.estado === 'en_proceso')?.count ?? 0}
                  icon={Search} color="bg-amber-50 text-amber-600"
                  onClick={() => openTicketsPanel('Tickets en proceso', 'en_proceso')} />
                <KpiCard label="Tickets resueltos"
                  value={ticketStats?.por_estado.find(e => e.estado === 'resuelto')?.count ?? 0}
                  icon={CheckCircle2} color="bg-emerald-50 text-emerald-600"
                  onClick={() => openTicketsPanel('Tickets resueltos', 'resuelto')} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Tickets por estado" icon={Activity} delay={0.3} to="/admin/analisis/tickets">
                  <DonutChart data={ticketEstadoData} colors={COLORS.ticketEstado} />
                </ChartCard>

                <ChartCard title="Tickets por categoría" icon={Tag} delay={0.35} to="/admin/analisis/tickets">
                  <HBarChart data={ticketCatData} color={COLORS.ticketCategoria[0]} labelWidth={110} />
                </ChartCard>
              </div>
            </section>

            {/* ══ MASCOTAS ══════════════════════════════════════════════ */}
            <section>
              <SectionHeader
                icon={PawPrint}
                title="Reportes de mascotas"
                meta={reporteStats ? `${reporteStats.total.toLocaleString('es-CL')} reportes en total` : undefined}
                href="/admin/analisis/mascotas"
              />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Reportes totales" value={reporteStats?.total ?? 0}
                  icon={PawPrint} color="bg-slate-100 text-slate-600"
                  onClick={() => openReportsPanel('Todos los reportes')} />
                <KpiCard label="Perdidas"
                  value={reporteStats?.por_tipo.find(t => t.tipo === 'PERDIDA')?.count ?? 0}
                  icon={Search} color="bg-rose-50 text-rose-600"
                  onClick={() => openReportsPanel('Mascotas perdidas', { tipo: 'PERDIDA' })} />
                <KpiCard label="Encontradas"
                  value={reporteStats?.por_tipo.find(t => t.tipo === 'ENCONTRADA')?.count ?? 0}
                  icon={PawPrint} color="bg-emerald-50 text-emerald-600"
                  onClick={() => openReportsPanel('Mascotas encontradas', { tipo: 'ENCONTRADA' })} />
                <KpiCard label="Resueltos"
                  value={reporteStats?.por_estado.find(e => e.estado === 'RESUELTO')?.count ?? 0}
                  icon={CheckCircle2} color="bg-brand-50 text-brand-600"
                  onClick={() => openReportsPanel('Casos resueltos', { estado: 'RESUELTO' })} />
              </div>

              {/* Gráficos fila 1: 3 donuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <ChartCard title="Tipo de reporte" icon={Search} delay={0.4} to="/admin/analisis/mascotas">
                  <DonutChart data={mascotaTipoData} colors={COLORS.mascotaTipo} />
                </ChartCard>

                <ChartCard title="Estado del reporte" icon={Activity} delay={0.45} to="/admin/analisis/mascotas">
                  <DonutChart data={mascotaEstadoData} colors={COLORS.mascotaEstado} />
                </ChartCard>

                <ChartCard title="Tamaño de mascota" icon={TrendingUp} delay={0.5} to="/admin/analisis/mascotas">
                  <DonutChart data={mascotaTamanioData} colors={COLORS.mascotaTamanio} />
                </ChartCard>
              </div>

              {/* Gráfico fila 2: especie */}
              <ChartCard title="Por especie" icon={PawPrint} delay={0.55} to="/admin/analisis/mascotas">
                <HBarChart data={especieData} color={COLORS.especie} labelWidth={90} />
              </ChartCard>
            </section>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminPage;
