import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

let mockIsAuthenticated = true;
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, loading: false }),
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, onClick }: any) => <button onClick={onClick}>{texto || 'Volver'}</button>,
}));
vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

let capturedSocketCallback: ((c: any) => void) | null = null;
vi.mock('../../../hooks/useSoporteSocket', () => ({
  useSoporteSocket: (_id: any, cb: (c: any) => void) => {
    capturedSocketCallback = cb;
  },
}));

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    misTickets: vi.fn(),
    verTicket: vi.fn(),
    tomarTicket: vi.fn(),
    actualizarEstado: vi.fn(),
    responderTicket: vi.fn(),
    agregarComentario: vi.fn(),
  },
}));

import TicketsPage from '../../../pages/soporte/TicketsPage';
import { ticketService } from '../../../services/ticketService';
const mockTicketService = vi.mocked(ticketService);

const tkBase = {
  id: 'tk1',
  asunto: 'Problema de prueba',
  descripcion: 'desc',
  estado: 'abierto' as const,
  categoria: 'consulta_general' as const,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  user_id: 'u1',
  comentarios: [],
};

describe('TicketsPage - socket dedup logic (lines 50-51)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSocketCallback = null;
    mockIsAuthenticated = true;
    mockTicketService.misTickets.mockResolvedValue([tkBase] as any);
    mockTicketService.verTicket.mockResolvedValue(tkBase as any);
  });

  it('adds new real-time comment to the list', async () => {
    render(<MemoryRouter><TicketsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Problema de prueba'));
    fireEvent.click(screen.getAllByText('Problema de prueba')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a mis tickets'));

    expect(capturedSocketCallback).not.toBeNull();
    const nuevo = { id: 'rt1', contenido: 'Comentario en tiempo real', autorId: 'u2', created_at: '2025-01-01T11:00:00Z' };
    act(() => { capturedSocketCallback!(nuevo); });
    await waitFor(() => expect(screen.getByText('Comentario en tiempo real')).toBeInTheDocument());
  });

  it('does NOT add duplicate real-time comment (dedup branch)', async () => {
    render(<MemoryRouter><TicketsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Problema de prueba'));
    fireEvent.click(screen.getAllByText('Problema de prueba')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a mis tickets'));

    const nuevo = { id: 'rt1', contenido: 'Comentario duplicado', autorId: 'u2', created_at: '2025-01-01T11:00:00Z' };
    act(() => {
      capturedSocketCallback!(nuevo);
      capturedSocketCallback!(nuevo); // duplicate — should NOT be added twice
    });
    await waitFor(() => {
      const items = screen.queryAllByText('Comentario duplicado');
      expect(items.length).toBe(1);
    });
  });
});
