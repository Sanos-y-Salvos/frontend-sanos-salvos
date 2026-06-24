import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminMensajesPage from '../../../pages/admin/AdminMensajesPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

const salaReportada = {
  sala: {
    id: 's1',
    matchId: 'm1',
    reporteAId: 'r1',
    reporteBId: 'r2',
    usuarioAId: 'u1',
    usuarioBId: 'u2',
    estado: 'CONGELADA' as const,
    creadoEn: '2025-01-01T10:00:00Z',
    actualizadoEn: '2025-01-01T10:00:00Z',
  },
  denuncias: [
    {
      id: 'd1',
      salaId: 's1',
      reportadoPor: 'user1',
      motivo: 'spam',
      creadoEn: '2025-01-01T10:00:00Z',
    },
  ],
};

vi.mock('../../../services/mensajeriaService', () => ({
  listarSalasReportadas: vi.fn().mockResolvedValue([]),
  cambiarEstadoSala: vi.fn().mockResolvedValue(undefined),
}));

import { listarSalasReportadas, cambiarEstadoSala } from '../../../services/mensajeriaService';
const mockListar = vi.mocked(listarSalasReportadas);
const mockCambiar = vi.mocked(cambiarEstadoSala);

const renderPage = () =>
  render(<MemoryRouter><AdminMensajesPage /></MemoryRouter>);

describe('AdminMensajesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListar.mockResolvedValue([]);
    mockCambiar.mockResolvedValue(undefined as any);
  });

  it('shows loading state initially', () => {
    mockListar.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });

  it('shows empty state when no reportadas', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('No hay conversaciones reportadas pendientes.')).toBeInTheDocument()
    );
  });

  it('shows error when loading fails', async () => {
    mockListar.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudieron cargar las conversaciones reportadas.'
      )
    );
  });

  it('shows reported conversations', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('spam')).toBeInTheDocument()
    );
  });

  it('renders page header', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Conversaciones reportadas')).toBeInTheDocument()
    );
  });

  it('clausura a sala', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() => screen.getByText('spam'));
    fireEvent.click(screen.getByRole('button', { name: /clausurar/i }));
    await waitFor(() =>
      expect(mockCambiar).toHaveBeenCalledWith('s1', 'CLAUSURADA')
    );
  });

  it('removes sala from list after clausurar', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /clausurar/i }));
    fireEvent.click(screen.getByRole('button', { name: /clausurar/i }));
    await waitFor(() =>
      expect(screen.queryByText('spam')).not.toBeInTheDocument()
    );
  });

  it('mantiene activa una sala', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() => screen.getByRole('button', { name: /restaurar/i }));
    fireEvent.click(screen.getByRole('button', { name: /restaurar/i }));
    await waitFor(() =>
      expect(mockCambiar).toHaveBeenCalledWith('s1', 'ACTIVA')
    );
  });

  it('shows error when action fails', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    mockCambiar.mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('spam'));
    fireEvent.click(screen.getByRole('button', { name: /clausurar/i }));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'No se pudo cambiar el estado de la conversación.'
      )
    );
  });

  it('navigates to sala detail when clicking Ver conversación', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() => screen.getByText('Ver conversación'));
    fireEvent.click(screen.getByText('Ver conversación'));
    expect(mockNavigate).toHaveBeenCalledWith('/mensajes/s1');
  });

  it('plural text for multiple salas', async () => {
    const sala2 = { ...salaReportada, sala: { ...salaReportada.sala, id: 's2' }, denuncias: [{ id: 'd2', salaId: 's2', reportadoPor: 'u2', motivo: 'otro motivo', creadoEn: '2025-01-01T10:00:00Z' }] };
    mockListar.mockResolvedValue([salaReportada, sala2] as any);
    renderPage();
    await waitFor(() => {
      const clausurarBtns = screen.getAllByRole('button', { name: /clausurar/i });
      expect(clausurarBtns.length).toBe(2);
    });
  });

  it('shows denuncia motivo in conversation list', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('spam')).toBeInTheDocument());
  });

  it('shows "Sin motivo" when denuncia has no motivo', async () => {
    const sinMotivo = {
      ...salaReportada,
      denuncias: [{ id: 'd2', salaId: 's1', reportadoPor: 'user2', creadoEn: '2025-01-01T10:00:00Z' }],
    };
    mockListar.mockResolvedValue([sinMotivo] as any);
    renderPage();
    await waitFor(() => expect(screen.getByText('Sin motivo especificado')).toBeInTheDocument());
  });
});
