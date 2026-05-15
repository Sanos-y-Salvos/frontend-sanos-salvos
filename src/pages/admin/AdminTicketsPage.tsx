import { useState, useEffect } from 'react';
import { ticketService } from '../../services/ticketService';
import type { Ticket } from '../../types';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
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

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const data = await ticketService.listarTickets(filtroEstado || undefined);
      setTickets(data);
    } catch {
      setError('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTickets();
  }, [filtroEstado]);

  const handleVerTicket = async (id: string) => {
    try {
      const ticket = await ticketService.verTicket(id);
      setTicketSeleccionado(ticket);
      setNuevoEstado(ticket.estado);
    } catch {
      setError('Error al cargar el ticket');
    }
  };

  const handleAsignar = async () => {
    if (!ticketSeleccionado) return;
    setEnviando(true);
    try {
      const actualizado = await ticketService.asignarTicket(ticketSeleccionado.id);
      setTicketSeleccionado(actualizado);
      cargarTickets();
    } catch {
      setError('Error al asignar el ticket');
    } finally {
      setEnviando(false);
    }
  };

  const handleResponder = async () => {
    if (!respuesta.trim() || !ticketSeleccionado) return;
    setEnviando(true);
    try {
      await ticketService.responderTicket(ticketSeleccionado.id, respuesta);
      const actualizado = await ticketService.verTicket(ticketSeleccionado.id);
      setTicketSeleccionado(actualizado);
      setRespuesta('');
      cargarTickets();
    } catch {
      setError('Error al responder el ticket');
    } finally {
      setEnviando(false);
    }
  };

  const handleActualizarEstado = async () => {
    if (!ticketSeleccionado || !nuevoEstado) return;
    setEnviando(true);
    try {
      const actualizado = await ticketService.actualizarEstado(ticketSeleccionado.id, nuevoEstado);
      setTicketSeleccionado(actualizado);
      cargarTickets();
    } catch {
      setError('Error al actualizar el estado');
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

            <BotonVolver onClick={() => setTicketSeleccionado(null)} texto="← Volver a tickets" />

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
              <p className="text-sm text-gray-500 mb-1">
                {ticketSeleccionado.user_id
                  ? <><span className="font-medium">Usuario ID:</span> {ticketSeleccionado.user_id}</>
                  : <><span className="font-medium">Email contacto:</span> {ticketSeleccionado.email_contacto ?? '—'}</>
                }
              </p>
              {ticketSeleccionado.asignado_a && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Asignado a:</span> {ticketSeleccionado.asignado_a}
                </p>
              )}
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-3">
                {ticketSeleccionado.descripcion}
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Acciones</h2>
              <div className="space-y-3">
                {ticketSeleccionado.estado === 'abierto' && (
                  <Button
                    onClick={handleAsignar}
                    disabled={enviando}
                    fullWidth
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    Tomar ticket
                  </Button>
                )}
                <div className="flex gap-2">
                  <Select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="flex-1"
                  >
                    <option value="abierto">Abierto</option>
                    <option value="en_proceso">En proceso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </Select>
                  <Button
                    onClick={handleActualizarEstado}
                    disabled={enviando || nuevoEstado === ticketSeleccionado.estado}
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    Actualizar
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-semibold text-gray-700 mb-4 border-b pb-2">Conversación</h2>
              {ticketSeleccionado.comentarios.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay comentarios aún</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {ticketSeleccionado.comentarios.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-lg p-3 text-sm ${
                        c.tipo_autor === 'administrador'
                          ? 'bg-blue-50 border border-blue-100'
                          : 'bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs font-medium ${c.tipo_autor === 'administrador' ? 'text-blue-600' : 'text-gray-500'}`}>
                          {c.tipo_autor === 'administrador' ? '🛠️ Soporte' : '👤 Usuario'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      <p className="text-gray-700">{c.contenido}</p>
                    </div>
                  ))}
                </div>
              )}
              {ticketSeleccionado.estado !== 'cerrado' && (
                <div className="space-y-2">
                  <textarea
                    value={respuesta}
                    onChange={(e) => setRespuesta(e.target.value)}
                    placeholder="Escribe tu respuesta al usuario..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <Button
                    onClick={handleResponder}
                    disabled={enviando || !respuesta.trim()}
                    fullWidth
                  >
                    {enviando ? 'Enviando...' : 'Responder'}
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="mb-6">
            <BotonVolver ruta="/admin" texto="← Panel de control" />
            <h1 className="text-xl font-bold text-gray-800">Gestión de Tickets</h1>
          </div>

          <Card className="p-4 mb-4">
            <div className="flex gap-2 flex-wrap">
              {['', 'abierto', 'en_proceso', 'resuelto', 'cerrado'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filtroEstado === estado
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {estado === '' ? 'Todos' : estadoLabel[estado]}
                </button>
              ))}
            </div>
          </Card>

          {error && <Alert variant="error" className="mb-4">{error}</Alert>}

          {loading ? (
            <div className="text-center py-12 text-gray-400">Cargando tickets...</div>
          ) : tickets.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-3">🎫</div>
              <h2 className="font-semibold text-gray-700">No hay tickets</h2>
              <p className="text-sm text-gray-400 mt-1">No se encontraron tickets con ese filtro.</p>
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
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400">
                      {ticket.user_id ? `Usuario: ${ticket.user_id.slice(0, 8)}...` : `Email: ${ticket.email_contacto ?? '—'}`}
                    </p>
                    {ticket.comentarios?.length > 0 && (
                      <p className="text-xs text-blue-500">
                        {ticket.comentarios.length} comentario{ticket.comentarios.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
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

export default AdminTicketsPage;
