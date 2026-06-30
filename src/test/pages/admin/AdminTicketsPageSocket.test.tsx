import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

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

let capturedSocketCb: ((c: any) => void) | null = null;
vi.mock('../../../hooks/useSoporteSocket', () => ({
  useSoporteSocket: (_id: any, cb: (c: any) => void) => {
    capturedSocketCb = cb;
  },
}));

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    listarTickets: vi.fn(),
    verTicket: vi.fn(),
    asignarTicket: vi.fn(),
    actualizarEstado: vi.fn(),
    responderTicket: vi.fn(),
  },
}));

import AdminTicketsPage from '../../../pages/admin/AdminTicketsPage';
import { ticketService } from '../../../services/ticketService';
const mockTicketService = vi.mocked(ticketService);

const tkAdmin = {
  id: 'atk1',
  user_id: 'u1',
  categoria: 'consulta_general',
  asunto: 'Ticket socket admin',
  descripcion: 'desc',
  estado: 'abierto' as const,
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  comentarios: [],
};

describe('AdminTicketsPage - socket dedup (lines 105-106)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedSocketCb = null;
    mockTicketService.listarTickets.mockResolvedValue([tkAdmin] as any);
    mockTicketService.verTicket.mockResolvedValue(tkAdmin as any);
    mockTicketService.asignarTicket.mockResolvedValue({ ...tkAdmin, estado: 'en_proceso' } as any);
    mockTicketService.actualizarEstado.mockResolvedValue({ ...tkAdmin } as any);
    mockTicketService.responderTicket.mockResolvedValue(undefined as any);
  });

  it('adds real-time comment in admin ticket detail', async () => {
    render(<MemoryRouter><AdminTicketsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Ticket socket admin'));
    fireEvent.click(screen.getAllByText('Ticket socket admin')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));

    expect(capturedSocketCb).not.toBeNull();
    const comentario = { id: 'rt1', contenido: 'Admin RT comment', autorId: 'admin1', created_at: '2025-01-01T11:00:00Z' };
    act(() => { capturedSocketCb!(comentario); });
    await waitFor(() => expect(screen.getByText('Admin RT comment')).toBeInTheDocument());
  });

  it('dedup: does not add same comment twice in admin view', async () => {
    render(<MemoryRouter><AdminTicketsPage /></MemoryRouter>);
    await waitFor(() => screen.getByText('Ticket socket admin'));
    fireEvent.click(screen.getAllByText('Ticket socket admin')[0].closest('button')!);
    await waitFor(() => screen.getByText('Volver a tickets'));

    const comentario = { id: 'rt2', contenido: 'Dup admin comment', autorId: 'admin1', created_at: '2025-01-01T11:00:00Z' };
    act(() => {
      capturedSocketCb!(comentario);
      capturedSocketCb!(comentario);
    });
    await waitFor(() => {
      expect(screen.queryAllByText('Dup admin comment').length).toBe(1);
    });
  });
});
