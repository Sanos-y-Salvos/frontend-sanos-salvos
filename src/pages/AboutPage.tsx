import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🐾</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">¿Quiénes somos?</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Una plataforma tecnológica chilena comprometida con el bienestar animal, construyendo tecnología que conecta comunidades para recuperar mascotas perdidas.
          </p>
        </div>
      </section>

      {/* Misión y visión */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-12">
            Misión y visión
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-xl p-8 border border-blue-100">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-800 text-lg mb-3">Nuestra misión</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Facilitar la localización y recuperación de mascotas perdidas en Chile mediante una plataforma tecnológica colaborativa que conecte a ciudadanos, veterinarias y municipalidades, reduciendo el tiempo de separación entre las mascotas y sus familias.
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-100">
              <div className="text-3xl mb-4">🔭</div>
              <h3 className="font-bold text-gray-800 text-lg mb-3">Nuestra visión</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Ser la plataforma de referencia nacional para el bienestar y la recuperación de mascotas, construyendo una red solidaria donde ninguna mascota perdida quede sin encontrar a su familia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* El problema que resolvemos */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                El problema que resolvemos
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                En Chile, miles de mascotas se pierden cada año. Los dueños recurren a publicaciones en redes sociales, carteles en postes y llamadas a veterinarias de forma desorganizada, sin un sistema centralizado que conecte a quienes buscan con quienes pueden ayudar.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Veterinarias y municipalidades reciben animales sin identificación sin manera eficiente de cruzar información con reportes de mascotas perdidas. El resultado: reunificaciones tardías o inexistentes.
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                <span className="font-semibold text-blue-600">Sanos y Salvos</span> centraliza este proceso: un solo lugar donde reportar, buscar y coordinar, con notificaciones en tiempo real y una red activa de colaboradores.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-md text-center">
                <div className="text-3xl mb-2">😢</div>
                <p className="text-xs text-gray-500 font-medium">Sin plataforma</p>
                <p className="text-xs text-gray-400 mt-1">Búsqueda desorganizada y tardía</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md text-center">
                <div className="text-3xl mb-2">🔗</div>
                <p className="text-xs text-gray-500 font-medium">Sin conexión</p>
                <p className="text-xs text-gray-400 mt-1">Veterinarias y municipios aislados</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-md text-center">
                <div className="text-3xl mb-2">⏰</div>
                <p className="text-xs text-gray-500 font-medium">Tiempo perdido</p>
                <p className="text-xs text-gray-400 mt-1">Días o semanas sin noticias</p>
              </div>
              <div className="bg-blue-600 rounded-xl p-5 shadow-md text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-xs text-white font-medium">Con Sanos y Salvos</p>
                <p className="text-xs text-blue-100 mt-1">Red coordinada en tiempo real</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona la plataforma */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-3">
            Cómo funciona la plataforma
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12">
            Construida sobre una arquitectura de microservicios para garantizar escalabilidad y disponibilidad
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center w-full md:w-48">
              <div className="text-3xl mb-3">🔐</div>
              <p className="font-semibold text-gray-800 text-sm">Autenticación</p>
              <p className="text-xs text-gray-500 mt-1">Registro e inicio de sesión seguros con JWT</p>
            </div>

            <div className="text-blue-300 text-2xl font-light rotate-90 md:rotate-0">→</div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center w-full md:w-48">
              <div className="text-3xl mb-3">👥</div>
              <p className="font-semibold text-gray-800 text-sm">Usuarios</p>
              <p className="text-xs text-gray-500 mt-1">Gestión de perfiles, roles y accesos por tipo de usuario</p>
            </div>

            <div className="text-blue-300 text-2xl font-light rotate-90 md:rotate-0">→</div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center w-full md:w-48">
              <div className="text-3xl mb-3">🎫</div>
              <p className="font-semibold text-gray-800 text-sm">Soporte</p>
              <p className="text-xs text-gray-500 mt-1">Sistema de tickets y chatbot para resolver consultas</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            Cada servicio opera de forma independiente, comunicándose a través de una API Gateway centralizada
          </p>
        </div>
      </section>

      {/* Stakeholders */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-3">
            ¿A quién va dirigida?
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12">
            Una red de actores que trabajan juntos por el bienestar animal
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl mb-4">👤</div>
              <h3 className="font-semibold text-gray-800 mb-2">Ciudadanos</h3>
              <p className="text-sm text-gray-500">
                Reportan mascotas perdidas o encontradas, reciben alertas en su zona y colaboran activamente con la comunidad para reunir familias con sus animales.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl mb-4">🏥</div>
              <h3 className="font-semibold text-gray-800 mb-2">Veterinarias</h3>
              <p className="text-sm text-gray-500">
                Colaboran en la recuperación registrando animales que llegan sin identificación, verificando microchips y conectando mascotas encontradas con sus dueños.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl mb-4">🏛️</div>
              <h3 className="font-semibold text-gray-800 mb-2">Municipalidades</h3>
              <p className="text-sm text-gray-500">
                Coordinan el control de animales callejeros a nivel comunal, colaboran con veterinarias y facilitan procesos de adopción responsable en su territorio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
