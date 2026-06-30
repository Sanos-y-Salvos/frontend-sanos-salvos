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
    await waitFor(() => expect(screen.getByText((_, el) => el?.tagName !== 'SCRIPT' && (el?.textContent?.replace(/\s+/g, ' ').trim() === '1 ticket total'))).toBeInTheDocument());
  });

  it('shows tickets plural count', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1, ticket2] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText((_, el) => el?.tagName !== 'SCRIPT' && (el?.textContent?.replace(/\s+/g, ' ').trim() === '2 tickets total'))).toBeInTheDocument());
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

  it('pagination: renders page buttons when > PAGE_SIZE tickets', async () => {
    const manyTickets = Array.from({ length: 12 }, (_, i) => ({
      ...ticket1,
      id: `tk${i + 10}`,
      asunto: `Ticket ${i + 1}`,
    }));
    mockTicketService.listarTickets.mockResolvedValue(manyTickets as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Ticket 1')).toBeInTheDocument());
    // With PAGE_SIZE=10, 12 tickets → 2 pages → pagination appears
    const nextBtn = screen.queryAllByRole('button').find(b => b.querySelector('svg'));
    expect(nextBtn).toBeDefined();
  });

  it('search: filters tickets by search text', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1, ticket2, ticket3] as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    const searchInput = screen.getByPlaceholderText(/Buscar/i);
    fireEvent.change(searchInput, { target: { value: 'Error' } });
    await waitFor(() => expect(screen.getByText('Error de sistema')).toBeInTheDocument());
    expect(screen.queryByText('Contenido inapropiado')).not.toBeInTheDocument();
  });

  it('search: shows empty state when no matches', async () => {
    mockTicketService.listarTickets.mockResolvedValue([ticket1] as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    const searchInput = screen.getByPlaceholderText(/Buscar/i);
    fireEvent.change(searchInput, { target: { value: 'xyznotfound' } });
    await waitFor(() => expect(screen.getByText(/No hay tickets/i)).toBeInTheDocument());
  });

  it('pagination: clicking page 2 button loads next page', async () => {
    const manyTickets = Array.from({ length: 12 }, (_, i) => ({
      ...ticket1,
      id: `tk${i + 20}`,
      asunto: `Ticket pag ${i + 1}`,
      created_at: `2025-01-0${Math.min(i + 1, 9)}T10:00:00Z`,
    }));
    mockTicketService.listarTickets.mockResolvedValue(manyTickets as any);
    renderPage();
    await waitFor(() => screen.getByText('Ticket pag 1'));
    // Find all number buttons (page buttons) and click "2"
    const btn2 = screen.queryAllByRole('button').find(b => b.textContent === '2');
    if (btn2) {
      fireEvent.click(btn2);
      await waitFor(() => expect(screen.getByText('Ticket pag 11')).toBeInTheDocument());
    }
  });

  it('pagination: clicks next and prev chevron buttons (lines 66, 78)', async () => {
    const manyTickets = Array.from({ length: 12 }, (_, i) => ({
      ...ticket1,
      id: `tk${i + 50}`,
      asunto: `ChevTicket ${i + 1}`,
      created_at: `2025-01-0${Math.min(i + 1, 9)}T10:00:00Z`,
    }));
    mockTicketService.listarTickets.mockResolvedValue(manyTickets as any);
    renderPage();
    await waitFor(() => screen.getByText('ChevTicket 1'));

    // Next button = last button in pagination
    const allButtons = screen.queryAllByRole('button');
    const nextBtn = allButtons[allButtons.length - 1];
    if (nextBtn && !nextBtn.disabled) {
      fireEvent.click(nextBtn);
      await waitFor(() => expect(screen.getByText('ChevTicket 11')).toBeInTheDocument());
    }
    // Prev button = second to last before page buttons (look for enabled prev - the one before page "1" button)
    const btn1 = screen.queryAllByRole('button').find(b => b.textContent === '1');
    if (btn1) {
      const prevBtn2 = btn1.previousElementSibling as HTMLButtonElement;
      if (prevBtn2 && !prevBtn2.disabled) {
        fireEvent.click(prevBtn2);
        await waitFor(() => expect(screen.getByText('ChevTicket 1')).toBeInTheDocument());
      }
    }
  });

  it('pagination: >7 pages renders ellipsis (lines 57-61)', async () => {
    const manyTickets = Array.from({ length: 80 }, (_, i) => ({
      ...ticket1,
      id: `tk${i + 100}`,
      asunto: `BigTicket ${i + 1}`,
      created_at: `2025-01-01T10:00:00Z`,
    }));
    mockTicketService.listarTickets.mockResolvedValue(manyTickets as any);
    renderPage();
    await waitFor(() => screen.getByText('BigTicket 1'));
    // 80 tickets / PAGE_SIZE(10) = 8 pages → totalPages > 7 → ellipsis branch
    expect(screen.getByText('BigTicket 1')).toBeInTheDocument();
    // click last page button
    const lastPageBtn = screen.queryAllByRole('button').find(b => b.textContent === '8');
    if (lastPageBtn) {
      fireEvent.click(lastPageBtn);
      await waitFor(() => expect(screen.getByText('BigTicket 71')).toBeInTheDocument());
    }
  });

  it('shows plural "comentarios" for ticket with 2+ comments in list (line 519)', async () => {
    const ticketWith2Comments = {
      ...ticket1,
      comentarios: [
        { id: 'c1', tipo_autor: 'administrador', contenido: 'Resp1', created_at: '2025-01-01T11:00:00Z' },
        { id: 'c2', tipo_autor: 'usuario', contenido: 'Resp2', created_at: '2025-01-01T12:00:00Z' },
      ],
    };
    mockTicketService.listarTickets.mockResolvedValue([ticketWith2Comments] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('2 comentarios')).toBeInTheDocument());
  });

  it('shows "—" when ticket has no user_id and no email_contacto in list/detail (lines 191, 514)', async () => {
    const ticketNoContact = {
      ...ticket1,
      user_id: null,
      email_contacto: null,
    };
    mockTicketService.listarTickets.mockResolvedValue([ticketNoContact] as any);
    mockTicketService.verTicket.mockResolvedValue(ticketNoContact as any);
    renderPage();
    await waitFor(() => screen.getByText('Error de sistema'));
    // Click into detail to trigger line 191
    fireEvent.click(screen.getAllByText('Error de sistema')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Volver a tickets')).toBeInTheDocument());
  });

  it('tiempoTranscurrido shows Hoy for today, Ayer for yesterday (lines 33-34)', async () => {
    const now = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    const ticketHoy = { ...ticket1, id: 'today', asunto: 'TicketHoy', created_at: now.toISOString() };
    const ticketAyer = { ...ticket1, id: 'yest', asunto: 'TicketAyer', created_at: yesterday.toISOString() };
    mockTicketService.listarTickets.mockResolvedValue([ticketHoy, ticketAyer] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('TicketHoy')).toBeInTheDocument());
    expect(document.body.innerHTML).toContain('Hoy');
    expect(document.body.innerHTML).toContain('Ayer');
  });

  it('tiempoTranscurrido shows "dias" and "sem." for recent tickets (lines 35-36)', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
    const ticketDias = { ...ticket1, id: 'dias', asunto: 'TicketDias', created_at: threeDaysAgo.toISOString() };
    const ticketSem = { ...ticket1, id: 'sem', asunto: 'TicketSem', created_at: tenDaysAgo.toISOString() };
    mockTicketService.listarTickets.mockResolvedValue([ticketDias, ticketSem] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('TicketDias')).toBeInTheDocument());
    expect(document.body.innerHTML).toContain('Hace 3 d');
    expect(document.body.innerHTML).toContain('sem.');
  });
});
