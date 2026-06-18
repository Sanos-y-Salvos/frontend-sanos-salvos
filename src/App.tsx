import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SoportePage from './pages/soporte/SoportePage';
import TicketsPage from './pages/soporte/TicketsPage';
import NuevoTicketPage from './pages/soporte/NuevoTicketPage';
import PerfilPage from './pages/perfil/PerfilPage';

import ChatbotWidget from './components/ChatbotWidget';
import { useLocation } from 'react-router-dom';
import AdminPage from './pages/admin/AdminPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';

import MapaPage from './pages/mapa/MapaPage'
import ReportesPage from './pages/reportes/ReportesPage'
import NuevoReportePage from './pages/reportes/NuevoReportePage'
import ReporteDetallePage from './pages/reportes/ReporteDetallePage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.rol !== 'administrador' && user.rol !== 'superadmin') return <Navigate to="/" />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const ocultarChatbot = location.pathname === '/mapa';

  return (
    <>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/registro" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
      <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
      <Route path="/soporte" element={<SoportePage />} />
      <Route path="/tickets" element={<TicketsPage />} />
      <Route path="/tickets/nuevo" element={<NuevoTicketPage />} />
      <Route path="/reportes" element={<ReportesPage />} />
      <Route path="/reportes/nuevo" element={<PrivateRoute><NuevoReportePage /></PrivateRoute>} />
      <Route path="/reportes/:id" element={<PrivateRoute><ReporteDetallePage /></PrivateRoute>} />
      <Route path="/mapa" element={<MapaPage />} />
      <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTicketsPage /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>

     {!ocultarChatbot && <ChatbotWidget />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;