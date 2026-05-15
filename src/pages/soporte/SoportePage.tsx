import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const SoportePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Soporte</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <button
            onClick={() => navigate('/tickets/nuevo')}
            className="bg-white rounded-xl shadow-md p-5 text-left hover:shadow-lg transition group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-xl group-hover:bg-purple-100 transition">
                🎫
              </div>
              <h3 className="font-semibold text-gray-800">Crear ticket de soporte</h3>
            </div>
            <p className="text-sm text-gray-500">
              Describe tu problema y el equipo te responderá a la brevedad.
            </p>
          </button>

          {isAuthenticated && (
            <button
              onClick={() => navigate('/tickets')}
              className="bg-white rounded-xl shadow-md p-5 text-left hover:shadow-lg transition group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl group-hover:bg-green-100 transition">
                  📋
                </div>
                <h3 className="font-semibold text-gray-800">Mis Tickets</h3>
              </div>
              <p className="text-sm text-gray-500">
                Revisa el estado de tus solicitudes de soporte.
              </p>
            </button>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SoportePage;
