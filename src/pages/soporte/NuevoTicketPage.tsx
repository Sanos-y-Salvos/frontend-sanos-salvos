import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticketService';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import BotonVolver from '../../components/layout/BotonVolver';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Alert from '../../components/ui/Alert';

const NuevoTicketPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: loadingAuth, user } = useAuth();

  const emailUsuario = user?.email ?? '';

  const [email, setEmail] = useState('');
  const [categoria, setCategoria] = useState('');
  const [asunto, setAsunto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [error, setError] = useState('');
  const [ticketCreado, setTicketCreado] = useState(false);

  if (!loadingAuth && !isAuthenticated && ticketCreado === false) {
    // no hacemos nada especial: el formulario funciona para todos
  }

  const handleCrearTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (categoria === 'otro' && !asunto.trim()) {
      setError('El asunto es requerido cuando la categoría es "Otro"');
      return;
    }

    setLoadingTicket(true);
    try {
      if (isAuthenticated) {
        await ticketService.crearTicket({ categoria, asunto: asunto || undefined, descripcion });
      } else {
        if (!email.trim()) { setError('El correo es requerido'); setLoadingTicket(false); return; }
        await ticketService.crearTicketPublico({ email, categoria, asunto: asunto || undefined, descripcion });
      }
      setTicketCreado(true);
    } catch {
      setError('Error al crear el ticket. Intenta nuevamente.');
    } finally {
      setLoadingTicket(false);
    }
  };

  if (ticketCreado) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ticket creado</h2>
            <p className="text-gray-500 text-sm mb-6">
              Tu solicitud fue registrada. El equipo de soporte te responderá a la brevedad.
            </p>
            <div className="flex gap-2">
              {isAuthenticated && (
                <Button onClick={() => navigate('/tickets')} fullWidth>Ver mis tickets</Button>
              )}
              <Button variant="secondary" onClick={() => navigate('/soporte')} fullWidth>Ir al inicio</Button>
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
        <div className="max-w-lg mx-auto">
          <Card className="p-8">
            <BotonVolver ruta="/soporte" texto="← Volver" />
            <h1 className="text-xl font-bold text-gray-800 mb-1">Crear ticket de soporte</h1>
            <p className="text-sm text-gray-500 mb-6">
              Describe tu problema y el equipo te responderá a la brevedad.
            </p>

            {error && <Alert variant="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleCrearTicket} className="space-y-4">

              {/* Email — pre-rellenado e ino editable si está autenticado */}
              {isAuthenticated ? (
                <div className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-200">
                  <span className="text-gray-400 text-xs block mb-0.5">Correo de contacto</span>
                  <span className="font-medium text-gray-700">{emailUsuario}</span>
                </div>
              ) : (
                <Input
                  label={<>Correo de contacto <span className="text-red-500">*</span></>}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.cl"
                  required
                />
              )}

              <Select
                label={<>Categoría <span className="text-red-500">*</span></>}
                value={categoria}
                onChange={(e) => { setCategoria(e.target.value); setAsunto(''); }}
                required
              >
                <option value="">Selecciona una categoría</option>
                <option value="problema_tecnico">Problema técnico</option>
                <option value="reporte_abuso">Reporte de abuso</option>
                <option value="otro">Otro</option>
              </Select>

              {categoria === 'otro' && (
                <Input
                  label={<>Asunto <span className="text-red-500">*</span></>}
                  type="text"
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Resumen breve del problema"
                  required
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el problema con el mayor detalle posible..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

<Button type="submit" disabled={loadingTicket || !categoria || !descripcion} fullWidth className="py-3">
                {loadingTicket ? 'Creando ticket...' : 'Enviar ticket'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NuevoTicketPage;
