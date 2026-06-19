import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeadphonesIcon, TicketCheck, ClipboardList, Bot,
  Clock, ShieldCheck, MessageSquare, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4, delay, ease: 'easeOut' },
});

const SoportePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                <HeadphonesIcon className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
              </div>
              <span className="text-brand-600 text-sm font-semibold">Centro de ayuda</span>
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">¿En qué podemos ayudarte?</h1>
            <p className="text-slate-500 text-sm">Elige la opción que mejor se adapte a tu necesidad.</p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">

        {/* Opciones principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <motion.button
            {...fadeUp(0)}
            onClick={() => navigate('/tickets/nuevo')}
            className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-6 text-left transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                <TicketCheck className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-1" />
            </div>
            <h3 className="font-display font-bold text-slate-900 mb-1">Crear ticket de soporte</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Describe tu problema y el equipo te responderá a la brevedad. Para casos que requieren atención humana.
            </p>
          </motion.button>

          {isAuthenticated && (
            <motion.button
              {...fadeUp(0.1)}
              onClick={() => navigate('/tickets')}
              className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 p-6 text-left transition-all duration-200 active:scale-[0.98]"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
                  <ClipboardList className="w-5 h-5 text-brand-600" strokeWidth={1.5} />
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all mt-1" />
              </div>
              <h3 className="font-display font-bold text-slate-900 mb-1">Mis tickets</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Revisa el estado y las respuestas de tus solicitudes de soporte anteriores.
              </p>
            </motion.button>
          )}
        </div>

        {/* Asistente virtual */}
        <motion.div {...fadeUp(0.15)} className="bg-gradient-to-br from-brand-700 to-brand-900 rounded-2xl p-6 mb-10 flex items-start gap-5">
          <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot className="w-6 h-6 text-white" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-white mb-1">Asistente virtual disponible</h3>
            <p className="text-brand-100 text-sm leading-relaxed">
              Para preguntas frecuentes, usa el chatbot en la esquina inferior derecha. Responde al instante sobre cómo crear reportes, usar el mapa, gestionar tu cuenta y más.
            </p>
          </div>
          <MessageSquare className="w-5 h-5 text-brand-300 flex-shrink-0 mt-0.5" />
        </motion.div>

        {/* Garantías */}
        <motion.div {...fadeUp(0.2)}>
          <h2 className="text-base font-display font-bold text-slate-900 mb-4">Nuestro compromiso</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Clock,        title: 'Respuesta rápida',   desc: 'Respondemos tickets en menos de 48 horas hábiles.'         },
              { icon: ShieldCheck,  title: 'Soporte seguro',     desc: 'Tus datos siempre protegidos durante el proceso.'           },
              { icon: HeadphonesIcon, title: 'Atención real',    desc: 'Cada ticket es revisado por una persona de nuestro equipo.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 p-5 flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default SoportePage;
