import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const rolLabel: Record<string, string> = {
    administrador: 'Administrador',
    superadmin: 'Super Administrador',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">

        <div className="mb-6">
          <BotonVolver ruta="/soporte" texto="← Volver" />
          <h1 className="text-2xl font-bold text-gray-800">Panel de Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, {user?.ciudadano?.primer_nombre} ·{' '}
            <span className="text-orange-600 font-medium">
              {rolLabel[user?.rol || ''] || user?.rol}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <button
            onClick={() => navigate('/admin/tickets')}
            className="bg-white rounded-xl shadow-md p-6 text-left hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl group-hover:bg-blue-100 transition">
                🎫
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Gestión de Tickets</h2>
                <p className="text-xs text-gray-400">Soporte y mesa de ayuda</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Revisa, asigna y responde los tickets de soporte de los usuarios de la plataforma.
            </p>
            <p className="text-xs text-blue-500 mt-3 font-medium">Ver tickets →</p>
          </button>

          <button
            onClick={() => navigate('/admin/usuarios')}
            className="bg-white rounded-xl shadow-md p-6 text-left hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-2xl group-hover:bg-green-100 transition">
                👥
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Gestión de Usuarios</h2>
                <p className="text-xs text-gray-400">Cuentas y permisos</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Administra las cuentas de ciudadanos e instituciones registradas en la plataforma.
            </p>
            <p className="text-xs text-green-500 mt-3 font-medium">Ver usuarios →</p>
          </button>

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminPage;