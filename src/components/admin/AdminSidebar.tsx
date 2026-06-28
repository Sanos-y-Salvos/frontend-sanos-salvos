  import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminMode } from '../../context/AdminModeContext';
import {
  PawPrint, LayoutDashboard, TicketCheck, Users,
  Eye, LogOut, User, BarChart2, ChevronDown, ShieldAlert, X, Menu, Bot,
} from 'lucide-react';

const ROL_COLOR: Record<string, string> = {
  moderador:     'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  administrador: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  superadmin:    'bg-rose-500/20 text-rose-300 border border-rose-500/30',
};
const ROL_LABEL: Record<string, string> = {
  moderador: 'Moderador', administrador: 'Administrador', superadmin: 'Super Admin',
};

const NAV_LINKS = [
  { label: 'Dashboard', path: '/admin',           icon: LayoutDashboard },
  { label: 'Tickets',   path: '/admin/tickets',   icon: TicketCheck },
  { label: 'Usuarios',  path: '/admin/usuarios',  icon: Users },
  { label: 'Mensajes',  path: '/admin/mensajes',  icon: ShieldAlert },
  { label: 'Asistente', path: '/admin/ayuda',     icon: Bot },
];

const ANALISIS_LINKS = [
  { label: 'Usuarios',  path: '/admin/analisis/usuarios' },
  { label: 'Mascotas',  path: '/admin/analisis/mascotas' },
  { label: 'Tickets',   path: '/admin/analisis/tickets'  },
];

const AdminSidebar = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuth();
  const { setAdminMode } = useAdminMode();

  const inAnalisis = location.pathname.startsWith('/admin/analisis');
  const [analisisOpen, setAnalisisOpen] = useState(inAnalisis);
  const [mobileOpen, setMobileOpen]     = useState(false);

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname === path;

  const nombreMostrar = user?.ciudadano
    ? `${user.ciudadano.primer_nombre} ${user.ciudadano.apellido_paterno}`
    : user?.institucion?.nombre_institucion || 'Empleado';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
    {/* Mobile overlay */}
    {mobileOpen && (
      <div
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setMobileOpen(false)}
      />
    )}

    <aside className={`fixed left-0 top-0 h-screen w-60 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-teal-950/85 backdrop-blur-2xl border-r border-white/10 flex-col z-50 select-none shadow-[8px_0_40px_-12px_rgba(13,148,136,0.45)] transition-transform duration-300
      ${mobileOpen ? 'flex translate-x-0' : '-translate-x-full md:translate-x-0 hidden md:flex'}
    `}>

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <button onClick={() => handleNavigate('/admin')} className="flex items-center gap-2.5">
          <PawPrint className="w-5 h-5 text-white" strokeWidth={2.5} />
          <div>
            <span className="font-display font-bold text-white text-sm tracking-tight block">
              Sanos y Salvos
            </span>
            <p className="text-[11px] text-slate-500">Panel interno</p>
          </div>
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-3 mb-2">Menú</p>

        {NAV_LINKS.map(({ label, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => handleNavigate(path)}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              isActive(path)
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isActive(path) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-teal-400" />
            )}
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            {label}
          </button>
        ))}

        {/* Analisis (colapsable) */}
        <div className="pt-1">
          <button
            onClick={() => setAnalisisOpen(v => !v)}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              inAnalisis
                ? 'bg-white/10 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {inAnalisis && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-teal-400" />
            )}
            <BarChart2 className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="flex-1 text-left">Análisis</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${analisisOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {analisisOpen && (
            <div className="mt-0.5 ml-7 space-y-0.5 border-l border-white/10 pl-3">
              {ANALISIS_LINKS.map(({ label, path }) => (
                <button
                  key={path}
                  onClick={() => handleNavigate(path)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    location.pathname === path
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="my-4 border-t border-white/10" />

        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest px-3 mb-2">Vista</p>
        <button
          onClick={() => setAdminMode(false)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Eye className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
          Ver como usuario
        </button>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5 mb-3">
          {user?.foto_perfil ? (
            <img src={user.foto_perfil} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{nombreMostrar}</p>
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${ROL_COLOR[user?.rol ?? ''] ?? 'bg-white/10 text-slate-300'}`}>
              {ROL_LABEL[user?.rol ?? ''] ?? user?.rol}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    {/* Mobile hamburger trigger (shows above bottom tab bar) */}
    {!mobileOpen && (
      <button
        className="md:hidden fixed bottom-[4.5rem] right-4 z-50 w-10 h-10 bg-slate-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/10"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="w-4.5 h-4.5 text-slate-300" />
      </button>
    )}

    {/* Mobile bottom tab bar */}
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 flex z-40"
      aria-label="Navegación móvil"
    >
      {NAV_LINKS.map(({ label, path, icon: Icon }) => (
        <button
          key={path}
          onClick={() => handleNavigate(path)}
          aria-label={label}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors cursor-pointer ${
            isActive(path) ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={1.5} />
          <span className="text-[9px] font-medium">{label}</span>
        </button>
      ))}
      <button
        onClick={() => handleNavigate('/admin/analisis/mascotas')}
        aria-label="Análisis"
        className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors cursor-pointer ${
          inAnalisis ? 'text-teal-400' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <BarChart2 className="w-5 h-5" strokeWidth={1.5} />
        <span className="text-[9px] font-medium">Análisis</span>
      </button>
    </nav>
    </>
  );
};

export default AdminSidebar;
