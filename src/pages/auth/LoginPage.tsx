import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, PawPrint, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Input from '../../components/ui/Input';
import Alert from '../../components/ui/Alert';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const EMPLOYEE_ROLES = ['moderador', 'administrador', 'superadmin'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const loggedUser = await login(email, password);
      navigate(EMPLOYEE_ROLES.includes(loggedUser.rol) ? '/admin' : '/');
    } catch {
      setError('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex public-glass">

      {/* Panel izquierdo — decorativo */}
      <div className="hidden lg:flex lg:w-1/2 bg-mesh flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-brand-300/15 rounded-full blur-3xl" />
        </div>

        <button onClick={() => navigate('/')} className="relative flex items-center gap-2.5 group w-fit">
          <PawPrint className="w-6 h-6 text-white" strokeWidth={2.5} />
          <span className="font-display font-bold text-white text-lg">Sanos y Salvos</span>
        </button>

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-brand-200 text-sm font-medium mb-3 uppercase tracking-wider">Plataforma nacional</p>
            <h2 className="text-3xl font-display font-bold text-white mb-4 leading-tight">
              Reuniendo familias<br />con sus mascotas
            </h2>
            <p className="text-brand-100/80 text-sm leading-relaxed max-w-xs">
              Miles de reportes activos en todo Chile. Inicia sesión y sé parte de la red que hace la diferencia.
            </p>
          </motion.div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Reportes activos', value: '2.400+' },
              { label: 'Coincidencias',    value: '890+'   },
              { label: 'Comunas',          value: '120+'   },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-white font-display font-bold text-xl">{value}</p>
                <p className="text-brand-200 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-brand-300/60 text-xs">© 2026 Sanos y Salvos</p>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-slate-50">

        {/* Mobile logo */}
        <button onClick={() => navigate('/')} className="lg:hidden flex items-center gap-2 mb-10">
          <PawPrint className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          <span className="font-display font-bold text-slate-900">Sanos y Salvos</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Bienvenido de vuelta</h1>
            <p className="text-slate-500 text-sm">Ingresa tus datos para continuar</p>
          </div>

          {error && <Alert variant="error" className="mb-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.cl"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Contraseña</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-10 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => navigate('/registro')}
                className="text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 transition-colors"
              >
                Regístrate gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
