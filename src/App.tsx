import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminModeProvider, useAdminMode } from './context/AdminModeContext';
import { useAuth } from './hooks/useAuth';
import { useLocation } from 'react-router-dom';

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
import AdminPage from './pages/admin/AdminPage';
import AdminTicketsPage from './pages/admin/AdminTicketsPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminMensajesPage from './pages/admin/AdminMensajesPage';
import AnalisisUsuariosPage from './pages/admin/analisis/AnalisisUsuariosPage';
import AnalisisMascotasPage from './pages/admin/analisis/AnalisisMascotasPage';
import AnalisisTicketsPage from './pages/admin/analisis/AnalisisTicketsPage';
import AdminSidebar from './components/admin/AdminSidebar';

import MapaPage from './pages/mapa/MapaPage';
import ReportesPage from './pages/reportes/ReportesPage';
import MisReportesPage from './pages/reportes/MisReportesPage';
import NuevoReportePage from './pages/reportes/NuevoReportePage';
import ReporteDetallePage from './pages/reportes/ReporteDetallePage';
import SalasPage from './pages/mensajes/SalasPage';
import ChatPage from './pages/mensajes/ChatPage';
import { MensajeriaProvider } from './context/MensajeriaContext';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  const ROLES = ['moderador', 'administrador', 'superadmin'];
  if (!ROLES.includes(user.rol)) return <Navigate to="/" />;
  return <>{children}</>;
};

const EMPLOYEE_ROLES = ['moderador', 'administrador', 'superadmin'];

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();
  const { isAdminMode, isEmployee } = useAdminMode();
  const location = useLocation();
  const ocultarChatbot = location.pathname === '/mapa';
  const showSidebar = isEmployee && isAdminMode;

  return (
    <>
      {showSidebar && <AdminSidebar />}
      <div className={showSidebar ? 'md:ml-60' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={EMPLOYEE_ROLES.includes(user?.rol ?? '') ? '/admin' : '/'} />} />
          <Route path="/registro" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
          <Route path="/reset-password" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
          <Route path="/soporte" element={<SoportePage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/nuevo" element={<NuevoTicketPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/mis-reportes" element={<PrivateRoute><MisReportesPage /></PrivateRoute>} />
          <Route path="/reportes/nuevo" element={<PrivateRoute><NuevoReportePage /></PrivateRoute>} />
          <Route path="/reportes/:id" element={<PrivateRoute><ReporteDetallePage /></PrivateRoute>} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/mensajes" element={<PrivateRoute><SalasPage /></PrivateRoute>} />
          <Route path="/mensajes/:salaId" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/perfil" element={<PrivateRoute><PerfilPage /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
          <Route path="/admin/tickets" element={<AdminRoute><AdminTicketsPage /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />
          <Route path="/admin/mensajes" element={<AdminRoute><AdminMensajesPage /></AdminRoute>} />
          <Route path="/admin/analisis/usuarios" element={<AdminRoute><AnalisisUsuariosPage /></AdminRoute>} />
          <Route path="/admin/analisis/mascotas" element={<AdminRoute><AnalisisMascotasPage /></AdminRoute>} />
          <Route path="/admin/analisis/tickets" element={<AdminRoute><AnalisisTicketsPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {!ocultarChatbot && <ChatbotWidget />}
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MensajeriaProvider>
          <AdminModeProvider>
            <AppRoutes />
          </AdminModeProvider>
        </MensajeriaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
