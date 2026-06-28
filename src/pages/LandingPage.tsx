import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PawPrint, ArrowRight, ClipboardList, Cpu, MessageCircle,
  User, Building2, Landmark, MapPin, ShieldCheck, Heart,
  Search, Bell, UserPlus,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col public-glass">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative bg-mesh overflow-hidden">
        {/* Decorative glow blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 py-28 text-center">
          <motion.div {...fadeUp(0)}>
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-100 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
              <ShieldCheck className="w-3.5 h-3.5" />
              Plataforma gratuita para ciudadanos chilenos
            </span>
          </motion.div>

          <motion.div className="animate-float mx-auto mb-8 w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20" {...fadeUp(0.05)}>
            <PawPrint className="w-10 h-10 text-white" strokeWidth={1.5} />
          </motion.div>

          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-display font-bold text-white mb-5 leading-tight tracking-tight">
            Encuentra a tu mascota,<br />
            <span className="text-brand-300">donde sea que esté</span>
          </motion.h1>

          <motion.p {...fadeUp(0.2)} className="text-brand-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Sanos y Salvos conecta ciudadanos, veterinarias y municipalidades para recuperar mascotas perdidas en Chile de forma rápida y colaborativa.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/registro')}
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Registrarse gratis
                </button>
                <button
                  onClick={() => navigate('/reportes')}
                  className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Ver reportes activos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/reportes/nuevo')}
                className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-brand-50 transition-all shadow-lg text-sm"
              >
                <ClipboardList className="w-4 h-4" />
                Crear nuevo reporte
              </button>
            )}
          </motion.div>
        </div>

        {/* Wave bottom */}
        <div className="relative h-12 overflow-hidden">
          <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Proceso simple</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2 mb-3">
              ¿Cómo funciona?
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">Tres pasos simples para recuperar a tu mascota</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px bg-gradient-to-r from-brand-200 via-brand-400 to-brand-200" />

            {[
              {
                step: '01',
                icon: UserPlus,
                title: 'Regístrate',
                desc: 'Crea tu cuenta como ciudadano, veterinaria o municipalidad en segundos. Sin costo.',
                delay: 0,
              },
              {
                step: '02',
                icon: ClipboardList,
                title: 'Reporta tu mascota',
                desc: 'Publica un reporte con foto, descripción y ubicación. Perdida o encontrada.',
                delay: 0.1,
              },
              {
                step: '03',
                icon: Cpu,
                title: 'El sistema conecta',
                desc: 'Nuestro motor de matching busca coincidencias y notifica a la red automáticamente.',
                delay: 0.2,
              },
            ].map(({ step, icon: Icon, title, desc, delay }) => (
              <motion.div key={step} {...fadeUp(delay)} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-20 h-20 bg-white rounded-2xl border border-brand-100 shadow-sm flex items-center justify-center">
                    <Icon className="w-8 h-8 text-brand-600" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.replace('0', '')}
                  </span>
                </div>
                <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién es ── */}
      <section className="bg-white py-24 px-6 border-y border-slate-100">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Red colaborativa</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2 mb-3">
              Para quién es
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto">Una plataforma con roles definidos para una red que funciona</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: User,
                title: 'Ciudadanos',
                color: 'brand',
                desc: 'Reporta mascotas perdidas o encontradas, recibe alertas en tu zona y colabora con la comunidad para reunir familias con sus mascotas.',
                features: ['Reportes ilimitados', 'Alertas por zona', 'Chat con otros usuarios'],
                delay: 0,
              },
              {
                icon: Building2,
                title: 'Veterinarias',
                color: 'emerald',
                desc: 'Registra mascotas sin dueño que lleguen a tu consulta, verifica microchips y conecta animales encontrados con sus familias.',
                features: ['Registro de encontrados', 'Verificación de chip', 'Perfil institucional'],
                delay: 0.1,
              },
              {
                icon: Landmark,
                title: 'Municipalidades',
                color: 'amber',
                desc: 'Gestiona el control de animales callejeros en tu comuna, coordina con veterinarias y facilita la adopción responsable.',
                features: ['Gestión comunal', 'Coordinación con redes', 'Estadísticas locales'],
                delay: 0.2,
              },
            ].map(({ icon: Icon, title, color, desc, features, delay }) => {
              const colors: Record<string, string> = {
                brand:   'bg-brand-50 text-brand-700 border-brand-100',
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                amber:   'bg-amber-50 text-amber-700 border-amber-100',
              };
              const iconColors: Record<string, string> = {
                brand:   'bg-brand-100 text-brand-600',
                emerald: 'bg-emerald-100 text-emerald-600',
                amber:   'bg-amber-100 text-amber-600',
              };
              return (
                <motion.div
                  key={title}
                  {...fadeUp(delay)}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${iconColors[color]}`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display font-bold text-slate-900 text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{desc}</p>
                  <ul className="space-y-1.5">
                    {features.map(f => (
                      <li key={f} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border mr-1.5 ${colors[color]}`}>
                        <Heart className="w-3 h-3" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features destacadas ── */}
      <section className="bg-slate-50 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp()} className="text-center mb-16">
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Tecnología</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mt-2 mb-3">
              Lo que nos hace diferentes
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Cpu,        title: 'Matching automático',  desc: 'IA que compara reportes por características, chip y distancia geográfica.',  delay: 0    },
              { icon: MapPin,     title: 'Mapa en tiempo real',  desc: 'Visualiza reportes activos en tu zona sobre mapa interactivo de Chile.',       delay: 0.05 },
              { icon: Bell,       title: 'Alertas instantáneas', desc: 'Notificaciones cuando aparece una coincidencia relevante cerca de ti.',        delay: 0.1  },
              { icon: Search,     title: 'Búsqueda por zona',    desc: 'Filtra reportes por especie, color, tamaño y radio geográfico.',               delay: 0.15 },
              { icon: MessageCircle, title: 'Chat privado',      desc: 'Comunicación directa y segura entre los involucrados en un match.',            delay: 0.2  },
              { icon: ShieldCheck, title: 'Verificación',        desc: 'Perfiles institucionales verificados para veterinarias y municipalidades.',     delay: 0.25 },
              { icon: ClipboardList, title: 'Soporte dedicado',  desc: 'Sistema de tickets con respuesta humana para casos complejos.',                delay: 0.3  },
              { icon: Heart,      title: 'Gratuito siempre',     desc: 'Sin costos para ciudadanos. La plataforma es un servicio público digital.',    delay: 0.35 },
            ].map(({ icon: Icon, title, desc, delay }) => (
              <motion.div
                key={title}
                {...fadeUp(delay)}
                className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-brand-200 hover:shadow-sm transition-all duration-200"
              >
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                </div>
                <h4 className="font-semibold text-slate-900 text-sm mb-1">{title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative bg-mesh overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-64 h-64 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-brand-300/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-6 py-24 text-center">
          <motion.div {...fadeUp()}>
            <div className="flex justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <PawPrint className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <Heart className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
              ¿Listo para encontrar a tu mascota?
            </h2>
            <p className="text-brand-100 text-lg mb-8 leading-relaxed">
              Únete a la red que conecta ciudadanos, veterinarias y municipalidades en todo Chile. Gratis, rápido y colaborativo.
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/registro')}
                  className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all shadow-lg text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear cuenta gratis
                </button>
                <button
                  onClick={() => navigate('/mapa')}
                  className="inline-flex items-center justify-center gap-2 border border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  Ver mapa
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
