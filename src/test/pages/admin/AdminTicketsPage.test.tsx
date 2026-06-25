import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminTicketsPage from '../../../pages/admin/AdminTicketsPage';

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, onClick }: any) => <button onClick={onClick}>{texto || 'Volver'}</button>,
}));
vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }: any) => <button onClick={onClick} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const ticket1 = {
  id: 'tk1', user_id: 'u1', categoria: 'problema_tecnico', asunto: 'Error de sistema',
  descripcion: 'El sistema falla al cargar.', estado: 'abierto',
  created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:00:00Z',
  comentarios: [],
};
const ticket2 = {
  id: 'tk2', user_id: null, email_contacto: 'anon@test.cl', categoria: 'reporte_abuso',
  asunto: 'Contenido inapropiado', descripcion: 'Hay spam.', estado: 'en_proceso',
  asignado_a: 'admin1',
  created_at: '2025-01-02T10:00:00Z', updated_at: '2025-01-02T10:00:00Z',
  comentarios: [
    { id: 'c1', tipo_autor: 'administrador', contenido: 'Revisando...', created_at: '2025-01-02T11:00:00Z' },
  ],
};
const ticket3 = {
  id: 'tk3', user_id: 'u2', categoria: 'otro', asunto: 'Consulta', descripcion: 'Tengo una consulta.',
  estado: 'cerrado', created_at: '2025-01-03T10:00:00Z', updated_at: '2025-01-03T10:00:00Z',
  comentarios: [],
};

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    listarTickets: vi.fn().mockResolvedValue([]),
    verTicket: vi.fn(),
    asignarTicket: vi.fn(),
    actualizarEstado: vi.fn(),
    responderTicket: vi.fn().mockResolvedValue(undefined),
  },
}));

import { ticketService } from '../../../services/ticketService';
const mockTicketService = vi.mocked(ticketService);

const renderPage = () =>
  render(<MemoryRouter><AdminTicketsPage /></MemoryRouter>);

describe('AdminTicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTicketService.listarTickets.mockResolvedValue([]);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    mockTicketService.asignarTicket.mockResolvedValue({ ...ticket1, estado: 'en_proceso' } as any);
    mockTicketService.actualizarEstado.mockResolvedValue({ ...ticket1, estado: 'resuelto' } as any);
    mockTicketService.responderTicket.mockResolvedValue(undefined as any);
  });

  it('renders the tickets list page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Gestión de Tickets')).toBeInTheDocument());
  });

  it('shows loading state', () => {
    mockTicketService.listarTickets.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Cargando tickets...')).toBeInTheDocument();
  });

  it('shows empty state when no tickets', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('No hay tickets')).toBeInTheDocument());
  });

  it('shows ticket count', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('1 ticket encontrado')).toBeInTheDocument());
  });

  it('shows tickets plural count', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1, ticket2] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('2 tickets encontrados')).toBeInTheDocument());
  });

  it('shows error when tickets fail to load', async () => {
    mockTicketService.listarTickets.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar los tickets')
    );
  });

  it('filters by estado', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Todos'));
    fireEvent.click(screen.getByText('Abierto'));
    await waitFor(() =>
      expect(mockTicketService.listarTickets).toHaveBeenCalledWith('abierto')
    );
  });

  it('filters "Todos" passes undefined', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Todos'));
    fireEvent.click(screen.getByText('En proceso'));
    await waitFor(() => expect(mockTicketService.listarTickets).toHaveBeenCalledWith('en_proceso'));
    fireEvent.click(screen.getByText('Todos'));
    await waitFor(() => expect(mockTicketService.listarTickets).toHaveBeenCalledWith(undefined));
  });

  it('opens ticket detail', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Volver a tickets')).toBeInTheDocument());
  });

  it('shows error when opening ticket fails', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar el ticket')
    );
  });

  it('detail: shows abierto ticket with Tomar ticket button', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Tomar ticket')).toBeInTheDocument());
  });

  it('detail: assigns ticket', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    mockTicketService.asignarTicket.mockResolvedValue({ ...ticket1, estado: 'en_proceso' } as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => screen.getByText('Tomar ticket'));
    fireEvent.click(screen.getByText('Tomar ticket'));
    await waitFor(() => expect(mockTicketService.asignarTicket).toHaveBeenCalledWith('tk1'));
  });

  it('detail: shows error when assigning fails', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    mockTicketService.asignarTicket.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => screen.getByText('Tomar ticket'));
    fireEvent.click(screen.getByText('Tomar ticket'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al asignar el ticket')
    );
  });

  it('detail: updates ticket status', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    mockTicketService.actualizarEstado.mockResolvedValue({ ...ticket2, estado: 'resuelto' } as any);
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => screen.getByText('Actualizar'));

    const estadoSelect = screen.getByRole('combobox');
    fireEvent.change(estadoSelect, { target: { value: 'resuelto' } });
    fireEvent.click(screen.getByText('Actualizar'));
    await waitFor(() => expect(mockTicketService.actualizarEstado).toHaveBeenCalledWith('tk2', 'resuelto'));
  });

  it('detail: does not update status if same estado', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => screen.getByText('Actualizar'));
    fireEvent.click(screen.getByText('Actualizar'));
    expect(mockTicketService.actualizarEstado).not.toHaveBeenCalled();
  });

  it('detail: shows error when update status fails', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    mockTicketService.actualizarEstado.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => screen.getByText('Actualizar'));
    const estadoSelect = screen.getByRole('combobox');
    fireEvent.change(estadoSelect, { target: { value: 'resuelto' } });
    fireEvent.click(screen.getByText('Actualizar'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al actualizar el estado')
    );
  });

  it('detail: responds to ticket', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket
      .mockResolvedValueOnce(ticket1 as any)
      .mockResolvedValueOnce({ ...ticket1, comentarios: [{ id: 'c1', tipo_autor: 'administrador', contenido: 'Respuesta admin', created_at: '2025-01-01T12:00:00Z' }] } as any);
    mockTicketService.responderTicket.mockResolvedValue(undefined as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Respuesta admin' } });
    fireEvent.click(screen.getByText('Responder'));
    await waitFor(() => expect(mockTicketService.responderTicket).toHaveBeenCalledWith('tk1', 'Respuesta admin'));
  });

  it('detail: shows error when responding fails', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    mockTicketService.responderTicket.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Respuesta' } });
    fireEvent.click(screen.getByText('Responder'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al responder el ticket')
    );
  });

  it('detail: closed ticket shows no response form', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket3] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket3 as any);
    renderPage();
    await waitFor(() => screen.getByText('Consulta'));
    fireEvent.click(screen.getAllByText('Consulta')[0].closest('button')!);
    await waitFor(() =>
      expect(screen.getByText('Este ticket está cerrado y no acepta más comentarios.')).toBeInTheDocument()
    );
  });

  it('detail: shows admin conversation comments', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => screen.getByText('Revisando...'));
    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  it('detail: shows email warning for non-registered user', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));
    expect(screen.getAllByText(/anon@test.cl/).length).toBeGreaterThan(0);
  });

  it('detail: shows asignado_a when ticket is assigned', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket2 as any);
    renderPage();
    await waitFor(() => screen.getByText('Contenido inapropiado'));
    fireEvent.click(screen.getAllByText('Contenido inapropiado')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Asignado a:')).toBeInTheDocument());
  });

  it('back button in detail reloads tickets', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    mockTicketService.verTicket.mockResolvedValue(ticket1 as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));
    fireEvent.click(screen.getByText('Volver a tickets'));
    await waitFor(() =>
      expect(mockTicketService.listarTickets).toHaveBeenCalledTimes(2)
    );
  });

  it('shows comment count on ticket cards', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket2] as any);
    renderPage();
    await waitFor(() => screen.getByText('1 comentario'));
  });
});
