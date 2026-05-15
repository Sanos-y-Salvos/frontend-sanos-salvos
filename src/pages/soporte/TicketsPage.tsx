import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticketService';
import type { Ticket } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';

const estadoColor: Record<string, string> = {
  abierto: 'bg-blue-100 text-blue-700',
  en_proceso: 'bg-yellow-100 text-yellow-700',
  resuelto: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-600',
};

const estadoLabel: Record<string, string> = {
  abierto: 'Abierto',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

const categoriaLabel: Record<string, string> = {
  problema_tecnico: 'Problema técnico',
  reporte_abuso: 'Reporte de abuso',
  otro: 'Otro',
};

const TicketsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: loadingAuth } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    ticketService.misTickets()
      .then(setTickets)
      .catch(() => setError('Error al cargar los tickets'))
      .finally(() => setLoading(false));
  }, []);

  const handleVerTicket = async (id: string) => {
    try {
      const ticket = await ticketService.verTicket(id);
      setTicketSeleccionado(ticket);
    } catch {
      setError('Error al cargar el ticket');
    }
  };

  const handleAgregarComentario = async () => {
    if (!comentario.trim() || !ticketSeleccionado) return;
    setEnviando(true);
    try {
      await ticketService.agregarComentario(ticketSeleccionado.id, comentario);
      const actualizado = await ticketService.verTicket(ticketSeleccionado.id);
      setTicketSeleccionado(actualizado);
      setComentario('');
    } catch {
      setError('Error al agregar comentario');
    } finally {
      setEnviando(false);
    }
  };

  if (ticketSeleccionado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-4">

            <BotonVolver onClick={() => setTicketSeleccionado(null)} texto="← Volver a mis tickets" />

            <Card className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h1 className="text-lg font-bold text-gray-800">{ticketSeleccionado.asunto}</h1>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${estadoColor[ticketSeleccionado.estado]}`}>
                  {estadoLabel[ticketSeleccionado.estado]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                {categoriaLabel[ticketSeleccionado.categoria]} · {new Date(ticketSeleccionado.created_at).toLocaleDateString('es-CL')}
              </p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                {ticketSeleccionado.descripcion}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Conversación</h2>
              {ticketSeleccionado.comentarios.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay comentarios aún</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {ticketSeleccionado.comentarios.map((c) => (
                    <div key={c.id} className={`rounded-lg p-3 text-sm ${c.tipo_autor === 'administrador' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${c.tipo_autor === 'administrador' ? 'text-blue-600' : 'text-gray-500'}`}>
                          {c.tipo_autor === 'administrador' ? '🛠️ Soporte' : '👤 Tú'}
                        </span>
                        <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('es-CL')}</span>
                      </div>
                      <p className="text-gray-700">{c.contenido}</p>
                    </div>
                  ))}
                </div>
              )}
              {ticketSeleccionado.estado !== 'cerrado' && (
                <div className="space-y-2">
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder="Agrega información adicional..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <Button onClick={handleAgregarComentario} disabled={enviando || !comentario.trim()} fullWidth>
                    {enviando ? 'Enviando...' : 'Agregar comentario'}
                  </Button>
                </div>
              )}
              {ticketSeleccionado.estado === 'cerrado' && (
                <p className="text-xs text-gray-400 text-center mt-2">Este ticket está cerrado y no acepta más comentarios.</p>
              )}
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!loadingAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Inicia sesión para ver tus tickets</h2>
            <p className="text-sm text-gray-500 mb-6">Necesitas una cuenta para gestionar solicitudes de soporte.</p>
            <div className="flex gap-2">
              <Link to="/login" className="flex-1 text-sm font-medium bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-center">
                Iniciar sesión
              </Link>
              <Link to="/registro" className="flex-1 text-sm font-medium border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition text-center">
                Registrarse
              </Link>
            </div>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <div>
              <BotonVolver ruta="/soporte" texto="← Volver" />
              <h1 className="text-xl font-bold text-gray-800">Mis Tickets</h1>
            </div>
            <Button onClick={() => navigate('/tickets/nuevo')}>+ Nuevo ticket</Button>
          </div>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando tickets...</div>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <h2 className="font-semibold text-gray-700 mb-1">No tienes tickets aún</h2>
              <p className="text-sm text-gray-400 mb-4">¿Tienes algún problema? Crea un ticket de soporte.</p>
              <Button onClick={() => navigate('/tickets/nuevo')}>Crear primer ticket</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => handleVerTicket(ticket.id)}
                  className="w-full bg-white rounded-xl shadow-md p-5 text-left hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{ticket.asunto}</h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${estadoColor[ticket.estado]}`}>
                      {estadoLabel[ticket.estado]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    {categoriaLabel[ticket.categoria]} · {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                  </p>
                  <p className="text-sm text-gray-500 line-clamp-2">{ticket.descripcion}</p>
                  {ticket.comentarios?.length > 0 && (
                    <p className="text-xs text-blue-500 mt-2">
                      {ticket.comentarios.length} comentario{ticket.comentarios.length > 1 ? 's' : ''}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketsPage;
