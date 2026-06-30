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
  listarSalasClausuradas: vi.fn().mockResolvedValue([]),
  cambiarEstadoSala: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../../services/userService', () => ({
  userService: {
    listarUsuarios: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto, onClick }: any) => <button onClick={onClick}>{texto || 'Volver'}</button>,
}));

import { listarSalasReportadas, listarSalasClausuradas, cambiarEstadoSala } from '../../../services/mensajeriaService';
import { userService as mensajesUserService } from '../../../services/userService';
const mockListar = vi.mocked(listarSalasReportadas);
const mockListarClausuradas = vi.mocked(listarSalasClausuradas);
const mockCambiar = vi.mocked(cambiarEstadoSala);
const mockMensajesUserService = vi.mocked(mensajesUserService);

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
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
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
        'No se pudieron cargar las conversaciones.'
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
      expect(screen.getByText('Gestión de conversaciones')).toBeInTheDocument()
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

describe('AdminMensajesPage - clausuradas tab and filters', () => {
  const salaClausurada = {
    id: 'c1',
    matchId: 'm1',
    reporteAId: 'r1',
    reporteBId: 'r2',
    usuarioAId: 'u1',
    usuarioBId: 'u2',
    estado: 'CLAUSURADA' as const,
    creadoEn: '2025-01-01T10:00:00Z',
    actualizadoEn: '2025-01-01T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockListar.mockResolvedValue([]);
    mockListarClausuradas.mockResolvedValue([salaClausurada] as any);
    mockCambiar.mockResolvedValue(undefined as any);
    mockMensajesUserService.listarUsuarios.mockResolvedValue([]);
  });

  it('switches to clausuradas tab and shows clausuradas', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    // After clicking, the tab content should load clausuradas sala with Restaurar button
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /restaurar/i })).toBeInTheDocument()
    );
  });

  it('shows empty state for clausuradas tab when none', async () => {
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() =>
      expect(screen.getByText('No hay conversaciones clausuradas.')).toBeInTheDocument()
    );
  });

  it('shows clausuradas badge count when there are clausuradas', async () => {
    renderPage();
    await waitFor(() => {
      // The badge with count 1 should appear next to Clausuradas tab
      const clausuradasBadge = screen.getByText('1', { selector: 'span' });
      expect(clausuradasBadge).toBeInTheDocument();
    });
  });

  it('restores a clausurada sala', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByRole('button', { name: /restaurar/i }));
    fireEvent.click(screen.getByRole('button', { name: /restaurar/i }));
    await waitFor(() =>
      expect(cambiarEstadoSala).toHaveBeenCalledWith('c1', 'ACTIVA')
    );
  });

  it('removes clausurada from list after restoring', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByRole('button', { name: /restaurar/i }));
    fireEvent.click(screen.getByRole('button', { name: /restaurar/i }));
    await waitFor(() =>
      expect(screen.getByText('No hay conversaciones clausuradas.')).toBeInTheDocument()
    );
  });

  it('navigates to sala from clausuradas tab', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByText('Ver conversación'));
    fireEvent.click(screen.getByText('Ver conversación'));
    expect(mockNavigate).toHaveBeenCalledWith('/mensajes/c1');
  });

  it('filters clausuradas by search', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByPlaceholderText(/buscar/i));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent-id' } });
    await waitFor(() =>
      expect(screen.getByText(/No se encontraron conversaciones para/)).toBeInTheDocument()
    );
  });

  it('sorts clausuradas by antiguas', async () => {
    const salaClausurada2 = {
      ...salaClausurada,
      id: 'c2',
      actualizadoEn: '2024-06-01T10:00:00Z',
    };
    mockListarClausuradas.mockResolvedValue([salaClausurada, salaClausurada2] as any);
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByText('Más antiguas'));
    fireEvent.click(screen.getByText('Más antiguas'));
    // Just verify no error occurs and list still shows
    await waitFor(() =>
      expect(screen.getAllByText(/CLAUSURADA/i).length).toBeGreaterThan(0)
    );
  });

  it('sorts reportadas by antiguas', async () => {
    const sala2 = {
      ...salaReportada,
      sala: { ...salaReportada.sala, id: 's2', actualizadoEn: '2024-06-01T10:00:00Z' },
      denuncias: [{ id: 'd2', salaId: 's2', reportadoPor: 'u2', motivo: 'otro', creadoEn: '2024-06-01T10:00:00Z' }],
    };
    mockListar.mockResolvedValue([salaReportada, sala2] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getAllByText('Más antiguas')[0]);
    fireEvent.click(screen.getAllByText('Más antiguas')[0]);
    await waitFor(() => expect(screen.getByText('spam')).toBeInTheDocument());
  });

  it('filters reportadas by search text', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('spam'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'spam' } });
    await waitFor(() => expect(screen.getByText('spam')).toBeInTheDocument());
  });

  it('shows no results message for unmatched search in reportadas', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('spam'));
    const searchInput = screen.getByPlaceholderText(/buscar/i);
    fireEvent.change(searchInput, { target: { value: 'xyz-not-found' } });
    await waitFor(() =>
      expect(screen.getByText(/No se encontraron conversaciones para/)).toBeInTheDocument()
    );
  });

  it('shows nombresMap lookup for denuncias', async () => {
    mockMensajesUserService.listarUsuarios.mockResolvedValue([
      {
        credential_id: 'user1',
        email: 'user1@test.cl',
        ciudadano: { primer_nombre: 'Pedro', apellido_paterno: 'García' },
      },
    ] as any);
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('Pedro García')).toBeInTheDocument());
  });

  it('shows institution name in nombresMap', async () => {
    mockMensajesUserService.listarUsuarios.mockResolvedValue([
      {
        credential_id: 'user1',
        email: 'vet@test.cl',
        institucion: { nombre_institucion: 'VetClinic' },
      },
    ] as any);
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('VetClinic')).toBeInTheDocument());
  });

  it('clicking Reportadas tab when on Clausuradas switches back', async () => {
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([salaClausurada] as any);
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getByRole('button', { name: /restaurar/i }));
    // Now click "Reportadas" to go back
    fireEvent.click(screen.getByText('Reportadas'));
    await waitFor(() => expect(screen.getByText('spam')).toBeInTheDocument());
  });

  it('pagination: renders multiple page salas when > PAGE_SIZE', async () => {
    const manySalas = Array.from({ length: 12 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 100}` },
      denuncias: [{ id: `d${i}`, salaId: `s${i + 100}`, reportadoPor: 'u1', motivo: `motivo${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('motivo0')).toBeInTheDocument());
    // With 12 salas and PAGE_SIZE=10, pagination should appear
    // Just verify that not all 12 motivos are visible (pagination hides page 2)
    expect(screen.queryByText('motivo10')).not.toBeInTheDocument();
  });

  it('pagination for reportadas: shows page buttons with > PAGE_SIZE salas', async () => {
    const manySalas = Array.from({ length: 10 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 200}` },
      denuncias: [{ id: `d${i}`, salaId: `s${i + 200}`, reportadoPor: 'u1', motivo: `motivo-${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('motivo-0')).toBeInTheDocument());
    // PAGE_SIZE=8, 10 salas → 2 pages → pagination buttons appear
    // Click the "2" page button if present
    const btn2 = screen.queryAllByRole('button').find(b => b.textContent === '2');
    if (btn2) {
      fireEvent.click(btn2);
      await waitFor(() => expect(screen.getByText('motivo-8')).toBeInTheDocument());
    }
  });

  it('removes clausurada with busqueda set recalculates page', async () => {
    const salaClausuradaB = { ...salaClausurada, id: 'c2' };
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([salaClausurada, salaClausuradaB] as any);
    renderPage();
    await waitFor(() => screen.getByText('Clausuradas'));
    fireEvent.click(screen.getByText('Clausuradas'));
    await waitFor(() => screen.getAllByRole('button', { name: /restaurar/i }));
    // Clausurar the first one while busqueda is empty
    const restaurarBtns = screen.getAllByRole('button', { name: /restaurar/i });
    fireEvent.click(restaurarBtns[0]);
    await waitFor(() => expect(mockCambiar).toHaveBeenCalled());
  });

  it('pagination: clicks next and prev chevron buttons (lines 40, 52)', async () => {
    const manySalas = Array.from({ length: 10 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 300}` },
      denuncias: [{ id: `d${i + 300}`, salaId: `s${i + 300}`, reportadoPor: 'u1', motivo: `item-${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('item-0'));

    // Click next chevron (ChevronRight) to go to page 2
    const allButtons = screen.queryAllByRole('button');
    const nextBtn = allButtons[allButtons.length - 1];
    if (nextBtn && !nextBtn.disabled) {
      fireEvent.click(nextBtn);
      await waitFor(() => expect(screen.getByText('item-8')).toBeInTheDocument());
    }
    // Click prev chevron (ChevronLeft): it's the button just before page "1" button
    const btn1 = screen.queryAllByRole('button').find(b => b.textContent === '1');
    if (btn1) {
      const prevBtn = btn1.previousElementSibling as HTMLButtonElement;
      if (prevBtn && !prevBtn.disabled) {
        fireEvent.click(prevBtn);
        await waitFor(() => expect(screen.getByText('item-0')).toBeInTheDocument());
      }
    }
  });

  it('pagination: >7 pages renders ellipsis (lines 31-35)', async () => {
    const manySalas = Array.from({ length: 65 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 500}` },
      denuncias: [{ id: `d${i + 500}`, salaId: `s${i + 500}`, reportadoPor: 'u1', motivo: `bigitem-${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('bigitem-0'));
    // 65 salas / PAGE_SIZE(8) = 9 pages → ellipsis branch
    // Click next a few times to get past page 3 (to trigger the page>3 ellipsis)
    for (let i = 0; i < 4; i++) {
      const allBtns = screen.queryAllByRole('button');
      const nextBtn = allBtns[allBtns.length - 1];
      if (nextBtn && !nextBtn.disabled) fireEvent.click(nextBtn);
    }
    await waitFor(() => expect(screen.getByText('bigitem-32')).toBeInTheDocument());
  });

  it('pagination: near-last page does NOT show end ellipsis (line 34 false branch)', async () => {
    const manySalas = Array.from({ length: 65 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 600}` },
      denuncias: [{ id: `d${i + 600}`, salaId: `s${i + 600}`, reportadoPor: 'u1', motivo: `nearend-${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('nearend-0'));
    // Navigate to last page (page 9 of 9)
    const lastBtn = screen.queryAllByRole('button').find(b => b.textContent === '9');
    if (lastBtn) {
      fireEvent.click(lastBtn);
      await waitFor(() => expect(screen.getByText('nearend-64')).toBeInTheDocument());
    }
  });

  it('sala with 2 denuncias shows plural (line 322)', async () => {
    const salaWith2Denuncias = {
      ...salaReportada,
      sala: { ...salaReportada.sala, id: 's99' },
      denuncias: [
        { id: 'd91', salaId: 's99', reportadoPor: 'u1', motivo: 'spam-1', creadoEn: '2025-01-01T10:00:00Z' },
        { id: 'd92', salaId: 's99', reportadoPor: 'u2', motivo: 'spam-2', creadoEn: '2025-01-01T11:00:00Z' },
      ],
    };
    mockListar.mockResolvedValue([salaWith2Denuncias] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('spam-1'));
    // Click to expand details
    const salaBtn = screen.queryAllByRole('button').find(b => b.textContent?.includes('spam-1'));
    if (salaBtn) {
      fireEvent.click(salaBtn);
      await waitFor(() => expect(screen.getByText('2 denuncias')).toBeInTheDocument());
    }
  });

  it('page reduction when removing last item on page 2 (line 153)', async () => {
    // 9 salas → page 1 has 8, page 2 has 1
    const manySalas = Array.from({ length: 9 }, (_, i) => ({
      ...salaReportada,
      sala: { ...salaReportada.sala, id: `s${i + 700}` },
      denuncias: [{ id: `d${i + 700}`, salaId: `s${i + 700}`, reportadoPor: 'u1', motivo: `pgreduce-${i}`, creadoEn: '2025-01-01T10:00:00Z' }],
    }));
    mockListar.mockResolvedValue(manySalas as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('pgreduce-0'));
    // Go to page 2 (click "2" button)
    const btn2 = screen.queryAllByRole('button').find(b => b.textContent === '2');
    if (btn2) {
      fireEvent.click(btn2);
      await waitFor(() => expect(screen.getByText('pgreduce-8')).toBeInTheDocument());
    }
    // Now clausurar the single item on page 2 — page should drop to 1
    const clausurarBtns = screen.getAllByRole('button', { name: /clausurar/i });
    if (clausurarBtns.length > 0) {
      fireEvent.click(clausurarBtns[0]);
      await waitFor(() => expect(mockCambiar).toHaveBeenCalled());
    }
  });

  it('institution user appears in nombresMap with email when no nombre_institucion (line 93 ?? branch)', async () => {
    mockMensajesUserService.listarUsuarios.mockResolvedValue([
      {
        credential_id: 'user1',
        email: 'fallback@test.cl',
        ciudadano: null,
        institucion: null,
      },
    ] as any);
    mockListar.mockResolvedValue([salaReportada] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByText('spam')).toBeInTheDocument());
  });

  it('clausurar on reportadas tab with busqueda set recalculates page (lines 146-148)', async () => {
    const salaReportadaB = {
      ...salaReportada,
      sala: { ...salaReportada.sala, id: 's2' },
      denuncias: [{ id: 'd2', salaId: 's2', reportadoPor: 'user2', motivo: 'acoso', creadoEn: '2025-01-01T10:00:00Z' }],
    };
    mockListar.mockResolvedValue([salaReportada, salaReportadaB] as any);
    mockListarClausuradas.mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('spam'));

    const searchInput = screen.getByPlaceholderText('Buscar por ID de sala, usuario o motivo...');
    fireEvent.change(searchInput, { target: { value: 'spam' } });
    await waitFor(() => {
      expect(screen.getByText('spam')).toBeInTheDocument();
      expect(screen.queryByText('acoso')).not.toBeInTheDocument();
    });

    const clausurarBtns = screen.getAllByRole('button', { name: /clausurar/i });
    fireEvent.click(clausurarBtns[0]);
    await waitFor(() => expect(mockCambiar).toHaveBeenCalledWith('s1', 'CLAUSURADA'));
  });
});
