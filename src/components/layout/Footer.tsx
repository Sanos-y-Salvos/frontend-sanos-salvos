import { useNavigate } from 'react-router-dom';
import { PawPrint, MapPin, Clock, Globe, ArrowRight } from 'lucide-react';
import { useAdminMode } from '../../context/AdminModeContext';

const Footer = () => {
  const navigate = useNavigate();
  const { isAdminMode } = useAdminMode();
  if (isAdminMode) return null;

  return (
    <footer className="bg-slate-950 text-slate-400">
      {/* Top accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-40" />

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">

          {/* Marca */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-white text-base">Sanos y Salvos</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Plataforma tecnológica para la localización y recuperación de mascotas perdidas en Chile, conectando ciudadanos, veterinarias y municipalidades.
            </p>
            <div className="flex items-center gap-4 mt-5 text-xs">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-brand-500" /> Disponible 24/7</span>
              <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-brand-500" /> Todo Chile</span>
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-brand-500" /> Gratuito</span>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Plataforma</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Reportes',        path: '/reportes' },
                { label: 'Mapa interactivo', path: '/mapa' },
                { label: 'Soporte',          path: '/soporte' },
                { label: 'Quiénes somos',    path: '/about' },
              ].map(({ label, path }) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-sm hover:text-brand-400 transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-brand-500" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-4">Cuenta</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Registrarse',   path: '/registro' },
                { label: 'Iniciar sesión', path: '/login' },
                { label: 'Nuevo reporte', path: '/reportes/nuevo' },
                { label: 'Soporte técnico', path: '/soporte' },
              ].map(({ label, path }) => (
                <li key={path}>
                  <button
                    onClick={() => navigate(path)}
                    className="text-sm hover:text-brand-400 transition-colors flex items-center gap-1 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200 text-brand-500" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs">© 2026 Sanos y Salvos. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4 text-xs">
            {[
              { label: 'Términos y Condiciones', path: '/terminos' },
              { label: 'Privacidad', path: '/privacidad' },
              { label: 'Normas de la Comunidad', path: '/politica' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="hover:text-brand-400 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
