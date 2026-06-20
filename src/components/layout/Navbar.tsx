import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAdminMode } from '../../context/AdminModeContext';
import {
  PawPrint, Menu, X, Map, ClipboardList, HeadphonesIcon,
  LogIn, UserPlus, LogOut, User, LayoutDashboard, ChevronDown, ChevronRight,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const navLinks = [
  { label: 'Inicio',         path: '/' },
  { label: 'Quiénes somos',  path: '/about' },
  { label: 'Reportes',       path: '/reportes', icon: ClipboardList },
  { label: 'Mapa',           path: '/mapa',     icon: Map },
  { label: 'Soporte',        path: '/soporte',  icon: HeadphonesIcon },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isAdminMode, isEmployee, setAdminMode } = useAdminMode();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [userMenu, setUserMenu]       = useState(false);

  const esAdmin = user?.rol === 'administrador' || user?.rol === 'superadmin' || user?.rol === 'moderador';

  const nombreMostrar = user?.ciudadano
    ? `${user.ciudadano.primer_nombre} ${user.ciudadano.apellido_paterno}`
    : user?.institucion?.nombre_institucion || 'Usuario';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuAbierto(false); setUserMenu(false); }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled ? 'glass border-b border-slate-200/60 shadow-sm' : 'bg-white border-b border-slate-100'
    } ${isEmployee && isAdminMode ? 'md:hidden' : ''}`}>

      {/* Banner "Volver al panel" — solo visible cuando empleado está en modo usuario */}
      {isEmployee && !isAdminMode && (
        <div className="hidden md:flex bg-slate-900 text-white text-xs items-center justify-between px-5 py-2">
          <span className="flex items-center gap-1.5 text-slate-400">
            <LayoutDashboard className="w-3 h-3" />
            Vista de usuario activa
          </span>
          <button
            onClick={() => setAdminMode(true)}
            className="flex items-center gap-1 font-semibold text-amber-300 hover:text-amber-200 transition-colors"
          >
            Volver al panel
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
        >
          <PawPrint className="w-6 h-6 text-slate-900" strokeWidth={2.5} />
          <span className="font-display font-bold text-slate-900 text-base tracking-tight">
            Sanos y Salvos
          </span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive(path)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
          {isAuthenticated && esAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 flex items-center gap-1.5 ${
                isActive('/admin')
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                {user?.foto_perfil ? (
                  <img src={user.foto_perfil} alt="Foto" className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-100" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{nombreMostrar}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-slate-100 shadow-lg py-1 overflow-hidden"
                  >
                    <button
                      onClick={() => navigate('/perfil')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      Mi perfil
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </button>
              <button
                onClick={() => navigate('/registro')}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                Registrarse
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {menuAbierto ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuAbierto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-slate-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map(({ label, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive(path)
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {label}
                </button>
              ))}
              {isAuthenticated && esAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Panel de administración
                </button>
              )}

              <div className="pt-2 border-t border-slate-100 mt-2 flex gap-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => navigate('/perfil')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Mi perfil
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      Iniciar sesión
                    </button>
                    <button
                      onClick={() => navigate('/registro')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Registro
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
