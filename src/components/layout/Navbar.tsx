import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const esAdmin = user?.rol === 'administrador' || user?.rol === 'superadmin';

  const nombreMostrar = user?.ciudadano
    ? `${user.ciudadano.primer_nombre} ${user.ciudadano.apellido_paterno}`
    : user?.institucion?.nombre_institucion || 'Usuario';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">

        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="font-bold text-gray-800 text-lg">Sanos y Salvos</span>
        </button>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => navigate('/')} className="text-sm text-gray-600 hover:text-blue-600 transition">
            Inicio
          </button>
          <button onClick={() => navigate('/about')} className="text-sm text-gray-600 hover:text-blue-600 transition">
            ¿Quiénes somos?
          </button>
          <button onClick={() => navigate('/soporte')} className="text-sm text-gray-600 hover:text-blue-600 transition">
            Soporte
          </button>
          {isAuthenticated && esAdmin && (
            <button onClick={() => navigate('/admin')} className="text-sm font-medium text-orange-600 hover:text-orange-700 transition">
              Panel de control
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/perfil')}
                className="flex items-center gap-2 hover:opacity-80 transition"
              >
                {user?.foto_perfil ? (
                  <img
                    src={user.foto_perfil}
                    alt="Foto"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                    {user?.tipo === 'institucion' ? '🏥' : '👤'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{nombreMostrar}</span>
              </button>
              <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 transition">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">
                Iniciar sesión
              </button>
              <button onClick={() => navigate('/registro')} className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Registrarse
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuAbierto(!menuAbierto)}
          className="md:hidden text-gray-600 hover:text-gray-800 transition"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>
      </div>

      {menuAbierto && (
        <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-3 max-w-6xl mx-auto">
          <button onClick={() => { navigate('/'); setMenuAbierto(false); }} className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 transition py-1">
            Inicio
          </button>
          <button onClick={() => { navigate('/about'); setMenuAbierto(false); }} className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 transition py-1">
            ¿Quiénes somos?
          </button>
          <button onClick={() => { navigate('/soporte'); setMenuAbierto(false); }} className="block w-full text-left text-sm text-gray-600 hover:text-blue-600 transition py-1">
            Soporte
          </button>
          {isAuthenticated && esAdmin && (
            <button onClick={() => { navigate('/admin'); setMenuAbierto(false); }} className="block w-full text-left text-sm font-medium text-orange-600 hover:text-orange-700 transition py-1">
              Panel de control
            </button>
          )}
          {isAuthenticated ? (
            <div className="flex gap-2 pt-2 items-center">
              <button onClick={() => { navigate('/perfil'); setMenuAbierto(false); }} className="flex-1 text-sm font-medium border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
                Mi perfil
              </button>
              <button onClick={() => { handleLogout(); setMenuAbierto(false); }} className="flex-1 text-sm font-medium text-red-500 border border-red-200 py-2 rounded-lg hover:bg-red-50 transition">
                Cerrar sesión
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button onClick={() => { navigate('/login'); setMenuAbierto(false); }} className="flex-1 text-sm font-medium border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition">
                Iniciar sesión
              </button>
              <button onClick={() => { navigate('/registro'); setMenuAbierto(false); }} className="flex-1 text-sm font-medium bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                Registrarse
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
