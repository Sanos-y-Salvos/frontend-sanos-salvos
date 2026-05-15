import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-7xl mb-6">🐾</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Encuentra a tu mascota,<br className="hidden md:block" /> donde sea que esté
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Sanos y Salvos conecta ciudadanos, veterinarias y municipalidades para recuperar mascotas perdidas en Chile de forma rápida y colaborativa.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/registro')}
                className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition text-sm"
              >
                Registrarse gratis
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-blue-700 transition text-sm"
              >
                Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-gray-500 text-center mb-12">Tres pasos simples para recuperar a tu mascota</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                📝
              </div>
              <div className="text-blue-600 font-bold text-sm mb-2">PASO 1</div>
              <h3 className="font-semibold text-gray-800 mb-2">Regístrate</h3>
              <p className="text-gray-500 text-sm">
                Crea tu cuenta como ciudadano, veterinaria o municipalidad en segundos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                📢
              </div>
              <div className="text-blue-600 font-bold text-sm mb-2">PASO 2</div>
              <h3 className="font-semibold text-gray-800 mb-2">Reporta tu mascota</h3>
              <p className="text-gray-500 text-sm">
                Publica un reporte con foto, descripción y ubicación de la última vez que la viste.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔍
              </div>
              <div className="text-blue-600 font-bold text-sm mb-2">PASO 3</div>
              <h3 className="font-semibold text-gray-800 mb-2">El sistema encuentra coincidencias</h3>
              <p className="text-gray-500 text-sm">
                La plataforma conecta tu reporte con avistamientos cercanos y notifica a la red.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Para quién es */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-3">
            Para quién es
          </h2>
          <p className="text-gray-500 text-center mb-12">Una red colaborativa con roles definidos</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="font-semibold text-gray-800 mb-2">Ciudadanos</h3>
              <p className="text-sm text-gray-500">
                Reporta mascotas perdidas o encontradas, recibe alertas en tu zona y colabora con la comunidad para reunir familias con sus mascotas.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-4">🏥</div>
              <h3 className="font-semibold text-gray-800 mb-2">Veterinarias</h3>
              <p className="text-sm text-gray-500">
                Registra mascotas sin dueño que lleguen a tu consulta, verifica microchips y conecta animales encontrados con sus familias.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="font-semibold text-gray-800 mb-2">Municipalidades</h3>
              <p className="text-sm text-gray-500">
                Gestiona el control de animales callejeros en tu comuna, coordina con veterinarias y facilita la adopción responsable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-blue-600 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-5xl mb-6">🐶🐱</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            ¿Listo para encontrar a tu mascota?
          </h2>
          <p className="text-blue-100 mb-8">
            Únete a la red que ya conecta ciudadanos, veterinarias y municipalidades en todo Chile.
          </p>
          {!isAuthenticated && (
            <button
              onClick={() => navigate('/registro')}
              className="bg-white text-blue-700 font-semibold px-10 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              Comenzar ahora
            </button>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
