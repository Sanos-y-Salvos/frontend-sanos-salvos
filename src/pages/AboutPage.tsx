import { motion } from 'framer-motion';
import {
  PawPrint, Target, Telescope, AlertTriangle, Link2, Clock,
  CheckCircle, User, Building2, Landmark, ShieldCheck, Users, Ticket,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

const AboutPage = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />

    {/* Hero */}
    <section className="relative bg-mesh overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-brand-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-56 h-56 bg-brand-300/15 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-3xl mx-auto px-6 py-24 text-center">
        <motion.div {...fadeUp()}>
          <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <PawPrint className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">¿Quiénes somos?</h1>
          <p className="text-brand-100 text-lg max-w-2xl mx-auto leading-relaxed">
            Una plataforma tecnológica chilena comprometida con el bienestar animal, construyendo tecnología que conecta comunidades para recuperar mascotas perdidas.
          </p>
        </motion.div>
      </div>
      <div className="relative h-12 overflow-hidden">
        <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <path d="M0,48 C360,0 1080,0 1440,48 L1440,48 L0,48 Z" fill="#f8fafc" />
        </svg>
      </div>
    </section>

    {/* Misión y visión */}
    <section className="bg-slate-50 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Propósito</span>
          <h2 className="text-3xl font-display font-bold text-slate-900 mt-2">Misión y visión</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Target,
              title: 'Nuestra misión',
              text: 'Facilitar la localización y recuperación de mascotas perdidas en Chile mediante una plataforma colaborativa que conecte a ciudadanos, veterinarias y municipalidades, reduciendo el tiempo de separación entre las mascotas y sus familias.',
              bg: 'bg-brand-50 border-brand-100',
              iconBg: 'bg-brand-100 text-brand-600',
              delay: 0,
            },
            {
              icon: Telescope,
              title: 'Nuestra visión',
              text: 'Ser la plataforma de referencia nacional para el bienestar y la recuperación de mascotas, construyendo una red solidaria donde ninguna mascota perdida quede sin encontrar a su familia.',
              bg: 'bg-slate-100 border-slate-200',
              iconBg: 'bg-slate-200 text-slate-600',
              delay: 0.1,
            },
          ].map(({ icon: Icon, title, text, bg, iconBg, delay }) => (
            <motion.div key={title} {...fadeUp(delay)} className={`rounded-2xl p-8 border ${bg}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${iconBg}`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-slate-900 text-lg mb-3">{title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* El problema */}
    <section className="bg-white py-24 px-6 border-y border-slate-100">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-14 items-center">
          <motion.div {...fadeUp()}>
            <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Contexto</span>
            <h2 className="text-3xl font-display font-bold text-slate-900 mt-2 mb-5">El problema que resolvemos</h2>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>En Chile, miles de mascotas se pierden cada año. Los dueños recurren a redes sociales, carteles y llamadas de forma desorganizada, sin un sistema centralizado.</p>
              <p>Veterinarias y municipalidades reciben animales sin manera eficiente de cruzar información con reportes de mascotas perdidas. El resultado: reunificaciones tardías o inexistentes.</p>
              <p><span className="font-semibold text-brand-700">Sanos y Salvos</span> centraliza este proceso: un solo lugar donde reportar, buscar y coordinar, con notificaciones en tiempo real.</p>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: AlertTriangle, label: 'Sin plataforma',  desc: 'Búsqueda desorganizada y tardía',   dark: false },
              { icon: Link2,         label: 'Sin conexión',    desc: 'Veterinarias y municipios aislados', dark: false },
              { icon: Clock,         label: 'Tiempo perdido',  desc: 'Días o semanas sin noticias',        dark: false },
              { icon: CheckCircle,   label: 'Con Sanos y Salvos', desc: 'Red coordinada en tiempo real',   dark: true  },
            ].map(({ icon: Icon, label, desc, dark }, i) => (
              <motion.div
                key={label}
                {...fadeUp(i * 0.07)}
                className={`rounded-2xl p-5 text-center border ${dark ? 'bg-brand-700 border-brand-600' : 'bg-white border-slate-100 shadow-sm'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-3 ${dark ? 'bg-white/20' : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${dark ? 'text-white' : 'text-slate-500'}`} strokeWidth={1.5} />
                </div>
                <p className={`text-xs font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>{label}</p>
                <p className={`text-xs mt-1 ${dark ? 'text-brand-200' : 'text-slate-400'}`}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Arquitectura */}
    <section className="bg-slate-50 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Tecnología</span>
          <h2 className="text-3xl font-display font-bold text-slate-900 mt-2 mb-2">Cómo funciona la plataforma</h2>
          <p className="text-slate-500 text-sm">Construida sobre microservicios para garantizar escalabilidad y disponibilidad</p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {[
            { icon: ShieldCheck, label: 'Autenticación', desc: 'Registro e inicio de sesión seguros con JWT', delay: 0 },
            { icon: Users,       label: 'Usuarios',      desc: 'Gestión de perfiles, roles y accesos',      delay: 0.1 },
            { icon: Ticket,      label: 'Soporte',       desc: 'Sistema de tickets y chatbot de nivel 1',   delay: 0.2 },
          ].map(({ icon: Icon, label, desc, delay }, idx, arr) => (
            <div key={label} className="flex items-center gap-4">
              <motion.div {...fadeUp(delay)} className="bg-white border border-brand-100 rounded-2xl p-6 text-center w-full md:w-44 shadow-sm">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-slate-800 text-sm">{label}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
              </motion.div>
              {idx < arr.length - 1 && (
                <ArrowRight className="text-brand-300 w-5 h-5 flex-shrink-0 rotate-90 md:rotate-0" />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8">
          Cada servicio opera de forma independiente a través de una API Gateway centralizada
        </p>
      </div>
    </section>

    {/* Stakeholders */}
    <section className="bg-white py-24 px-6 border-t border-slate-100">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-14">
          <span className="text-brand-600 text-sm font-semibold uppercase tracking-wider">Red de actores</span>
          <h2 className="text-3xl font-display font-bold text-slate-900 mt-2 mb-2">¿A quién va dirigida?</h2>
          <p className="text-slate-500 text-sm">Una red que trabaja junta por el bienestar animal</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: User,     title: 'Ciudadanos',     iconBg: 'bg-brand-100 text-brand-600',   desc: 'Reportan mascotas perdidas o encontradas, reciben alertas en su zona y colaboran activamente con la comunidad.', delay: 0    },
            { icon: Building2, title: 'Veterinarias',  iconBg: 'bg-emerald-100 text-emerald-600', desc: 'Registran animales sin identificación, verifican microchips y conectan mascotas encontradas con sus dueños.', delay: 0.1  },
            { icon: Landmark,  title: 'Municipalidades', iconBg: 'bg-amber-100 text-amber-600', desc: 'Coordinan el control de animales callejeros a nivel comunal y facilitan procesos de adopción responsable.', delay: 0.2  },
          ].map(({ icon: Icon, title, iconBg, desc, delay }) => (
            <motion.div key={title} {...fadeUp(delay)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-display font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default AboutPage;
