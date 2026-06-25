import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, TicketCheck, Loader2, MapPin, Building2,
  UserCircle, Tag, Activity, TrendingUp, RefreshCw,
  PawPrint, Search, CheckCircle2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { ticketService } from '../../services/ticketService';
import { getEstadisticasReportes, type EstadisticasReportes } from '../../services/reporteService';
import { regionService } from '../../services/regionService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

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
const KpiCard = ({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-5 h-5" strokeWidth={1.5} />
    </div>
    <div>
      <p className="text-2xl font-display font-bold text-slate-900 leading-none">{value.toLocaleString('es-CL')}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  </div>
);

/* ── Card contenedor ─────────────────────────────────────────────────── */
const ChartCard = ({ title, icon: Icon, delay = 0, children }: {
  title: string; icon: React.ElementType; delay?: number; children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
  >
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </motion.div>
);

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
const SectionHeader = ({ icon: Icon, title, meta }: {
  icon: React.ElementType; title: string; meta?: string;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
    <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{title}</h2>
    {meta && <span className="ml-auto text-xs text-slate-400 font-medium">{meta}</span>}
  </div>
);

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
const ESPECIE_EMOJI: Record<string, string> = {
  PERRO: '🐶', GATO: '🐱', AVE: '🐦', CONEJO: '🐰', HAMSTER: '🐹', REPTIL: '🦎', OTRO: '🐾',
};

/* ── Página ──────────────────────────────────────────────────────────── */
const AdminPage = () => {
  const { user } = useAuth();

  const [userStats,    setUserStats]    = useState<UserStats | null>(null);
  const [ticketStats,  setTicketStats]  = useState<TicketStats | null>(null);
  const [reporteStats, setReporteStats] = useState<EstadisticasReportes | null>(null);
  const [regionNames,  setRegionNames]  = useState<Record<string, string>>({});
  const [loading,      setLoading]      = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState<Date>(new Date());

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
    name: `${ESPECIE_EMOJI[e.especie] ?? '🐾'} ${e.especie.charAt(0) + e.especie.slice(1).toLowerCase()}`,
    value: e.count,
  }));

  const ROL_LABEL: Record<string, string> = {
    administrador: 'Administrador', superadmin: 'Super Administrador', moderador: 'Moderador',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

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

            {/* ══ USUARIOS ══════════════════════════════════════════════ */}
            <section>
              <SectionHeader
                icon={Users}
                title="Usuarios"
                meta={userStats ? `${userStats.total.toLocaleString('es-CL')} registrados · ${userStats.activos.toLocaleString('es-CL')} activos` : undefined}
              />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Total registrados" value={userStats?.total ?? 0}      icon={Users}      color="bg-slate-100 text-slate-600" />
                <KpiCard label="Cuentas activas"   value={userStats?.activos ?? 0}    icon={Activity}   color="bg-emerald-50 text-emerald-600" />
                <KpiCard label="Ciudadanos"         value={ciudadanoCount}              icon={UserCircle} color="bg-blue-50 text-blue-600" />
                <KpiCard label="Instituciones"      value={institucionCount}            icon={Building2}  color="bg-purple-50 text-purple-600" />
              </div>

              {/* Gráficos fila 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <ChartCard title="Tipo de usuario" icon={UserCircle} delay={0.05}>
                  <DonutChart data={tipoUsuarioData} colors={COLORS.tipoUsuario} />
                </ChartCard>

                <ChartCard title="Tipo de institución" icon={Building2} delay={0.1}>
                  <DonutChart data={tipoInstData} colors={COLORS.tipoInstitucion} />
                </ChartCard>

                <ChartCard title="Por rol" icon={Tag} delay={0.15}>
                  <HBarChart data={rolData} color={COLORS.rol} labelWidth={90} />
                </ChartCard>
              </div>

              {/* Gráficos fila 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Por región" icon={MapPin} delay={0.2}>
                  <HBarChart data={regionData} color={COLORS.region} labelWidth={130} />
                </ChartCard>

                <ChartCard title="Top 10 comunas" icon={TrendingUp} delay={0.25}>
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
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard title="Tickets por estado" icon={Activity} delay={0.3}>
                  <DonutChart data={ticketEstadoData} colors={COLORS.ticketEstado} />
                </ChartCard>

                <ChartCard title="Tickets por categoría" icon={Tag} delay={0.35}>
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
              />

              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Reportes totales" value={reporteStats?.total ?? 0}
                  icon={PawPrint} color="bg-slate-100 text-slate-600" />
                <KpiCard label="Perdidas"
                  value={reporteStats?.por_tipo.find(t => t.tipo === 'PERDIDA')?.count ?? 0}
                  icon={Search} color="bg-rose-50 text-rose-600" />
                <KpiCard label="Encontradas"
                  value={reporteStats?.por_tipo.find(t => t.tipo === 'ENCONTRADA')?.count ?? 0}
                  icon={PawPrint} color="bg-emerald-50 text-emerald-600" />
                <KpiCard label="Resueltos"
                  value={reporteStats?.por_estado.find(e => e.estado === 'RESUELTO')?.count ?? 0}
                  icon={CheckCircle2} color="bg-brand-50 text-brand-600" />
              </div>

              {/* Gráficos fila 1: 3 donuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <ChartCard title="Tipo de reporte" icon={Search} delay={0.4}>
                  <DonutChart data={mascotaTipoData} colors={COLORS.mascotaTipo} />
                </ChartCard>

                <ChartCard title="Estado del reporte" icon={Activity} delay={0.45}>
                  <DonutChart data={mascotaEstadoData} colors={COLORS.mascotaEstado} />
                </ChartCard>

                <ChartCard title="Tamaño de mascota" icon={TrendingUp} delay={0.5}>
                  <DonutChart data={mascotaTamanioData} colors={COLORS.mascotaTamanio} />
                </ChartCard>
              </div>

              {/* Gráfico fila 2: especie */}
              <ChartCard title="Por especie" icon={PawPrint} delay={0.55}>
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
