import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TicketsPage from '../../../pages/soporte/TicketsPage';

const mockNavigate = vi.fn();
let mockIsAuthenticated = true;
let mockLoadingAuth = false;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, loading: mockLoadingAuth }),
}));

const mockTickets = [
  {
    id: 't1',
    user_id: 'u1',
    categoria: 'problema_tecnico',
    asunto: 'No puedo iniciar sesión',
    descripcion: 'Hay un error al intentar iniciar sesión.',
    estado: 'abierto',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    comentarios: [],
  },
  {
    id: 't2',
    user_id: null,
    email_contacto: 'guest@test.cl',
    categoria: 'reporte_abuso',
    asunto: 'Usuario irrespetuoso',
    descripcion: 'El usuario X me molestó.',
    estado: 'en_proceso',
    created_at: '2025-01-02T10:00:00Z',
    updated_at: '2025-01-02T10:00:00Z',
    comentarios: [
      { id: 'c1', tipo_autor: 'administrador', contenido: 'Lo revisaremos', created_at: '2025-01-02T11:00:00Z' },
    ],
  },
  {
    id: 't3',
    user_id: 'u1',
    categoria: 'otro',
    asunto: 'Consulta general',
    descripcion: 'Tengo una consulta.',
    estado: 'resuelto',
    created_at: '2025-01-03T10:00:00Z',
    updated_at: '2025-01-03T10:00:00Z',
    comentarios: [],
  },
  {
    id: 't4',
    user_id: 'u1',
    categoria: 'problema_tecnico',
    asunto: 'Ticket cerrado',
    descripcion: 'Este está cerrado.',
    estado: 'cerrado',
    created_at: '2025-01-04T10:00:00Z',
    updated_at: '2025-01-04T10:00:00Z',
    comentarios: [],
  },
];

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    misTickets: vi.fn().mockResolvedValue([]),
    verTicket: vi.fn(),
    agregarComentario: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
    button: ({ children, onClick, ...p }: any) => <button onClick={onClick} {...p}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, onClick }: any) => <button onClick={onClick}>{texto || 'Volver'}</button>,
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

import { ticketService } from '../../../services/ticketService';
const mockTicketService = vi.mocked(ticketService);

const renderPage = () =>
  render(<MemoryRouter><TicketsPage /></MemoryRouter>);

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockLoadingAuth = false;
    mockTicketService.misTickets.mockResolvedValue([]);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[0] as any);
  });

  it('shows login prompt for unauthenticated user', async () => {
    mockIsAuthenticated = false;
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Inicia sesión para ver tus tickets')).toBeInTheDocument()
    );
  });

  it('shows loading state initially', async () => {
    mockTicketService.misTickets.mockReturnValue(new Promise(() => {}));
    renderPage();
    await waitFor(() => expect(screen.getByText('Cargando tickets...')).toBeInTheDocument());
  });

  it('shows empty state when no tickets', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('No tienes tickets aún')).toBeInTheDocument()
    );
  });

  it('shows tickets list', async () => {
    mockTicketService.misTickets.mockResolvedValue(mockTickets as any);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('No puedo iniciar sesión')).toBeInTheDocument()
    );
    expect(screen.getByText('Usuario irrespetuoso')).toBeInTheDocument();
  });

  it('shows comment count on tickets', async () => {
    mockTicketService.misTickets.mockResolvedValue(mockTickets as any);
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    expect(screen.getByText('1 comentario')).toBeInTheDocument();
  });

  it('shows error when tickets fail to load', async () => {
    mockTicketService.misTickets.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar los tickets')
    );
  });

  it('navigates to nuevo ticket from empty state', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Crear primer ticket'));
    fireEvent.click(screen.getByText('Crear primer ticket'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/nuevo');
  });

  it('navigates to nuevo ticket from header button', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Mis tickets'));
    fireEvent.click(screen.getByText('Nuevo'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets/nuevo');
  });

  it('opens ticket detail view', async () => {
    mockTicketService.misTickets.mockResolvedValue(mockTickets as any);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[0] as any);
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => expect(screen.getByText('Volver a mis tickets')).toBeInTheDocument());
  });

  it('shows error when ticket fails to load on click', async () => {
    mockTicketService.misTickets.mockResolvedValue(mockTickets as any);
    mockTicketService.verTicket.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al cargar el ticket')
    );
  });

  it('detail view: shows conversation with admin comment', async () => {
    mockTicketService.misTickets.mockResolvedValue(mockTickets as any);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[1] as any);
    renderPage();
    await waitFor(() => screen.getByText('Usuario irrespetuoso'));
    fireEvent.click(screen.getAllByText('Usuario irrespetuoso')[0].closest('button')!);
    await waitFor(() => screen.getByText('Lo revisaremos'));
    expect(screen.getByText('Soporte')).toBeInTheDocument();
  });

  it('detail view: can add comment', async () => {
    const ticketWithDetails = { ...mockTickets[0], comentarios: [] };
    const updatedTicket = {
      ...ticketWithDetails,
      comentarios: [
        { id: 'c2', tipo_autor: 'usuario', contenido: 'Nuevo comentario', created_at: '2025-01-01T12:00:00Z' },
      ],
    };
    mockTicketService.misTickets.mockResolvedValue([ticketWithDetails] as any);
    mockTicketService.verTicket
      .mockResolvedValueOnce(ticketWithDetails as any)
      .mockResolvedValueOnce(updatedTicket as any);
    mockTicketService.agregarComentario.mockResolvedValue(undefined as any);

    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a mis tickets'));

    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Nuevo comentario' } });
    fireEvent.click(screen.getByText('Agregar comentario'));

    await waitFor(() => expect(mockTicketService.agregarComentario).toHaveBeenCalled());
  });

  it('detail view: shows error when adding comment fails', async () => {
    mockTicketService.misTickets.mockResolvedValue([mockTickets[0]] as any);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[0] as any);
    mockTicketService.agregarComentario.mockRejectedValue(new Error('fail'));

    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a mis tickets'));

    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Comentario' } });
    fireEvent.click(screen.getByText('Agregar comentario'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al enviar el comentario')
    );
  });

  it('detail view: closed ticket shows no comment form', async () => {
    mockTicketService.misTickets.mockResolvedValue([mockTickets[3]] as any);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[3] as any);

    renderPage();
    await waitFor(() => screen.getByText('Ticket cerrado'));
    fireEvent.click(screen.getAllByText('Ticket cerrado')[0].closest('button')!);
    await waitFor(() =>
      expect(screen.getByText('Este ticket está cerrado y no acepta más comentarios.')).toBeInTheDocument()
    );
  });

  it('detail view: returns to list when back button is clicked', async () => {
    mockTicketService.misTickets.mockResolvedValue([mockTickets[0]] as any);
    mockTicketService.verTicket.mockResolvedValue(mockTickets[0] as any);
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a mis tickets'));
    fireEvent.click(screen.getByText('Volver a mis tickets'));
    await waitFor(() => expect(screen.getByText('Mis tickets')).toBeInTheDocument());
  });

  it('does not show ticket list while auth is still loading', () => {
    mockLoadingAuth = true;
    mockIsAuthenticated = false;
    renderPage();
    expect(screen.queryByText('Inicia sesión para ver tus tickets')).not.toBeInTheDocument();
  });

  it('detail view: shows empty conversation state', async () => {
    mockTicketService.misTickets.mockResolvedValue([mockTickets[0]] as any);
    mockTicketService.verTicket.mockResolvedValue({ ...mockTickets[0], comentarios: [] } as any);
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => screen.getByText('No hay comentarios aún'));
  });

  it('detail view: shows user comment as Tú', async () => {
    const ticketWithUserComment = {
      ...mockTickets[0],
      comentarios: [
        { id: 'c3', tipo_autor: 'usuario', contenido: 'Mi comentario', created_at: '2025-01-01T12:00:00Z' },
      ],
    };
    mockTicketService.misTickets.mockResolvedValue([ticketWithUserComment] as any);
    mockTicketService.verTicket.mockResolvedValue(ticketWithUserComment as any);
    renderPage();
    await waitFor(() => screen.getByText('No puedo iniciar sesión'));
    fireEvent.click(screen.getAllByText('No puedo iniciar sesión')[0].closest('button')!);
    await waitFor(() => screen.getByText('Tú'));
  });
});
