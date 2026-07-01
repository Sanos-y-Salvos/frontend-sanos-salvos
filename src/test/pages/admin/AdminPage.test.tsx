import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from '../../../pages/admin/AdminPage';

let mockUser: any = {
  id: '1', rol: 'administrador',
  ciudadano: { primer_nombre: 'Admin', apellido_paterno: 'Test' },
};

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../../services/userService', () => ({
  userService: {
    getEstadisticas: vi.fn().mockResolvedValue({
      total: 100, activos: 80,
      por_tipo: [{ tipo: 'ciudadano', count: 70 }, { tipo: 'institucion', count: 30 }],
      por_tipo_institucion: [{ tipo_institucion: 'veterinaria', count: 20 }, { tipo_institucion: 'municipalidad', count: 10 }],
      por_rol: [{ rol: 'ciudadano', count: 70 }],
      por_region: [{ region: '13', count: 50 }],
      top_comunas: [{ comuna: 'Santiago', count: 30 }],
    }),
    listarUsuarios: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    getEstadisticas: vi.fn().mockResolvedValue({
      total: 50,
      por_estado: [{ estado: 'abierto', count: 20 }],
      por_categoria: [{ categoria: 'problema_tecnico', count: 25 }],
    }),
    listarTickets: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../../services/reporteService', () => ({
  getEstadisticasReportes: vi.fn().mockResolvedValue({
    total: 200,
    por_tipo: [{ tipo: 'PERDIDA', count: 120 }, { tipo: 'ENCONTRADA', count: 80 }],
    por_estado: [{ estado: 'EN_BUSQUEDA', count: 100 }, { estado: 'RESUELTO', count: 60 }, { estado: 'ABANDONADO', count: 30 }, { estado: 'OCULTO', count: 10 }],
    por_tamanio: [{ tamanio: 'PEQUENO', count: 80 }, { tamanio: 'MEDIANO', count: 90 }, { tamanio: 'GRANDE', count: 30 }],
    por_especie: [{ especie: 'PERRO', count: 120 }, { especie: 'GATO', count: 70 }, { especie: 'AVE', count: 10 }],
  }),
  listarReportes: vi.fn().mockResolvedValue({ data: [], total: 0 }),
}));

vi.mock('../../../services/regionService', () => ({
  regionService: {
    getRegiones: vi.fn().mockResolvedValue([{ codigo: '13', nombre: 'Metropolitana' }]),
  },
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
  Tooltip: ({ content: Content }: any) => {
    if (!Content) return <div />;
    const Comp = Content?.type ?? Content;
    return typeof Comp === 'function' ? <Comp active={true} payload={[{ name: 'Test', value: 42 }]} /> : <div />;
  },
  Legend: ({ formatter }: any) =>
    formatter ? <span data-testid="legend-label">{formatter('TestLabel')}</span> : <div />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LabelList: () => <div />,
}));

import { userService } from '../../../services/userService';
import { ticketService } from '../../../services/ticketService';
import { getEstadisticasReportes, listarReportes } from '../../../services/reporteService';

const renderPage = () =>
  render(<MemoryRouter><AdminPage /></MemoryRouter>);

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: '1', rol: 'administrador',
      ciudadano: { primer_nombre: 'Admin', apellido_paterno: 'Test' },
    };
    vi.mocked(userService.getEstadisticas).mockResolvedValue({
      total: 100, activos: 80,
      por_tipo: [{ tipo: 'ciudadano', count: 70 }, { tipo: 'institucion', count: 30 }],
      por_tipo_institucion: [{ tipo_institucion: 'veterinaria', count: 20 }, { tipo_institucion: 'municipalidad', count: 10 }],
      por_rol: [{ rol: 'ciudadano', count: 70 }],
      por_region: [{ region: '13', count: 50 }],
      top_comunas: [{ comuna: 'Santiago', count: 30 }],
    } as any);
    vi.mocked(ticketService.getEstadisticas).mockResolvedValue({
      total: 50,
      por_estado: [{ estado: 'abierto', count: 20 }],
      por_categoria: [{ categoria: 'problema_tecnico', count: 25 }],
    } as any);
    vi.mocked(getEstadisticasReportes).mockResolvedValue({
      total: 200,
      por_tipo: [{ tipo: 'PERDIDA', count: 120 }, { tipo: 'ENCONTRADA', count: 80 }],
      por_estado: [{ estado: 'EN_BUSQUEDA', count: 100 }, { estado: 'RESUELTO', count: 60 }, { estado: 'ABANDONADO', count: 30 }, { estado: 'OCULTO', count: 10 }],
      por_tamanio: [{ tamanio: 'PEQUENO', count: 80 }, { tamanio: 'MEDIANO', count: 90 }, { tamanio: 'GRANDE', count: 30 }],
      por_especie: [{ especie: 'PERRO', count: 120 }, { especie: 'GATO', count: 70 }, { especie: 'AVE', count: 10 }],
    } as any);
    vi.mocked(userService.listarUsuarios).mockResolvedValue([]);
    vi.mocked(ticketService.listarTickets).mockResolvedValue([]);
    vi.mocked(listarReportes).mockResolvedValue({ data: [], total: 0 } as any);
  });

  it('shows loading state initially', () => {
    vi.mocked(userService.getEstadisticas).mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText('Cargando estadísticas...')).toBeInTheDocument();
  });

  it('renders welcome message with user name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Bienvenido, Admin')).toBeInTheDocument());
  });

  it('renders welcome without name when no ciudadano', async () => {
    mockUser = { id: '1', rol: 'superadmin' };
    renderPage();
    await waitFor(() => expect(screen.getByText('Bienvenido')).toBeInTheDocument());
  });

  it('renders KPI cards', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Total registrados')).toBeInTheDocument());
    expect(screen.getByText('Cuentas activas')).toBeInTheDocument();
    expect(screen.getByText('Ciudadanos')).toBeInTheDocument();
    expect(screen.getByText('Instituciones')).toBeInTheDocument();
  });

  it('renders section headers', async () => {
    renderPage();
    await waitFor(() => expect(screen.getAllByText(/Usuarios/).length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Soporte/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reportes de mascotas/).length).toBeGreaterThan(0);
  });

  it('shows refresh button', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Actualizar'));
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
  });

  it('refreshes data when Actualizar is clicked', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Actualizar'));
    fireEvent.click(screen.getByText('Actualizar'));
    await waitFor(() =>
      expect(vi.mocked(userService.getEstadisticas)).toHaveBeenCalledTimes(2)
    );
  });

  it('handles data loading failure silently', async () => {
    vi.mocked(userService.getEstadisticas).mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument());
  });

  it('shows rol badge for administrador', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Administrador')).toBeInTheDocument());
  });

  it('shows rol badge for superadmin', async () => {
    mockUser = { id: '1', rol: 'superadmin' };
    renderPage();
    await waitFor(() => expect(screen.getByText('Super Administrador')).toBeInTheDocument());
  });

  it('shows rol badge for moderador', async () => {
    mockUser = { id: '1', rol: 'moderador' };
    renderPage();
    await waitFor(() => expect(screen.getByText('Moderador')).toBeInTheDocument());
  });

  it('shows unknown rol raw value', async () => {
    mockUser = { id: '1', rol: 'otro_rol' };
    renderPage();
    await waitFor(() => expect(screen.getByText('otro_rol')).toBeInTheDocument());
  });

  it('shows update time when not loading', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByText('Cargando estadísticas...')).not.toBeInTheDocument());
    expect(screen.getByText(/Actualizado/)).toBeInTheDocument();
  });

  it('shows mascota KPI cards', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Reportes totales')).toBeInTheDocument());
    expect(screen.getByText('Perdidas')).toBeInTheDocument();
    expect(screen.getByText('Encontradas')).toBeInTheDocument();
    expect(screen.getByText('Resueltos')).toBeInTheDocument();
  });

  it('shows ticket KPI cards', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Total tickets')).toBeInTheDocument());
    expect(screen.getByText('Abiertos')).toBeInTheDocument();
    expect(screen.getByText('En proceso')).toBeInTheDocument();
    expect(screen.getByText('Tickets resueltos')).toBeInTheDocument();
  });

  it('opens users panel with empty state when Total registrados KPI is clicked', async () => {
    vi.mocked(userService.listarUsuarios).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => expect(vi.mocked(userService.listarUsuarios)).toHaveBeenCalled());
    await waitFor(() => screen.getByText('No hay registros para mostrar.'));
  });

  it('opens users panel and renders user items', async () => {
    const testUser = {
      id: 'u1', email: 'juan@test.cl', rol: 'ciudadano', tipo: 'ciudadano',
      is_active: true, created_at: '2025-01-01T00:00:00Z',
      ciudadano: { primer_nombre: 'Juan', apellido_paterno: 'Pérez' },
    };
    vi.mocked(userService.listarUsuarios).mockResolvedValue([testUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => screen.getByText('Juan Pérez'));
    expect(screen.getByText('juan@test.cl')).toBeInTheDocument();
  });

  it('renders user panel with institucion user (uses razon_social)', async () => {
    const instUser = {
      id: 'u2', email: 'vet@test.cl', rol: 'veterinaria', tipo: 'institucion',
      is_active: false, created_at: '2025-01-02T00:00:00Z',
      institucion: { razon_social: 'Clínica Vet Ltda.' },
    };
    vi.mocked(userService.listarUsuarios).mockResolvedValue([instUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => screen.getByText('Clínica Vet Ltda.'));
  });

  it('renders user panel with user that has no ciudadano or institucion (uses email)', async () => {
    const noSubUser = {
      id: 'u3', email: 'anon@test.cl', rol: 'ciudadano', tipo: 'ciudadano',
      is_active: true, created_at: '2025-01-03T00:00:00Z',
    };
    vi.mocked(userService.listarUsuarios).mockResolvedValue([noSubUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => expect(screen.getAllByText('anon@test.cl').length).toBeGreaterThan(0));
  });

  it('filters users by tipo when Ciudadanos KPI is clicked', async () => {
    const ciudadano = { id: 'u1', email: 'c@test.cl', rol: 'ciudadano', tipo: 'ciudadano', is_active: true,
      ciudadano: { primer_nombre: 'María', apellido_paterno: 'García' } };
    const institucion = { id: 'u2', email: 'i@test.cl', rol: 'veterinaria', tipo: 'institucion', is_active: true,
      institucion: { razon_social: 'Vet SA' } };
    vi.mocked(userService.listarUsuarios).mockResolvedValue([ciudadano, institucion] as any);
    renderPage();
    await waitFor(() => screen.getByText('Ciudadanos'));
    fireEvent.click(screen.getByText('Ciudadanos'));
    await waitFor(() => screen.getByText('María García'));
    expect(screen.queryByText('Vet SA')).not.toBeInTheDocument();
  });

  it('handles error when opening users panel fails', async () => {
    vi.mocked(userService.listarUsuarios).mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => expect(vi.mocked(userService.listarUsuarios)).toHaveBeenCalled());
  });

  it('opens reports panel and renders report items', async () => {
    const testReport = {
      id: 'r1', nombreMascota: 'Firulais', especie: 'PERRO', color: 'café',
      tipo: 'PERDIDA', estado: 'EN_BUSQUEDA', fechaPublicacion: '2025-01-01T00:00:00Z',
      direccionReferencia: 'Av. Siempre Viva',
    };
    vi.mocked(listarReportes).mockResolvedValue({ data: [testReport], total: 1 } as any);
    renderPage();
    await waitFor(() => screen.getByText('Reportes totales'));
    fireEvent.click(screen.getByText('Reportes totales'));
    await waitFor(() => screen.getByText('Firulais'));
  });

  it('renders report panel with no direccionReferencia', async () => {
    const testReport = {
      id: 'r2', nombreMascota: 'Luna', especie: 'GATO', color: 'blanco',
      tipo: 'ENCONTRADA', estado: 'RESUELTO', fechaPublicacion: '2025-01-02T00:00:00Z',
    };
    vi.mocked(listarReportes).mockResolvedValue({ data: [testReport], total: 1 } as any);
    renderPage();
    await waitFor(() => screen.getByText('Reportes totales'));
    fireEvent.click(screen.getByText('Reportes totales'));
    await waitFor(() => screen.getByText('Luna'));
  });

  it('handles error when opening reports panel fails', async () => {
    vi.mocked(listarReportes).mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Reportes totales'));
    fireEvent.click(screen.getByText('Reportes totales'));
    await waitFor(() => expect(vi.mocked(listarReportes)).toHaveBeenCalled());
  });

  it('opens tickets panel and renders ticket items', async () => {
    const testTicket = {
      id: 'tk1', asunto: 'Mi ticket urgente', categoria: 'otro',
      estado: 'abierto', email_contacto: 'user@test.cl',
      created_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(ticketService.listarTickets).mockResolvedValue([testTicket] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total tickets'));
    fireEvent.click(screen.getByText('Total tickets'));
    await waitFor(() => screen.getByText('Mi ticket urgente'));
  });

  it('renders ticket panel with unknown categoria (raw value)', async () => {
    const testTicket = {
      id: 'tk2', categoria: 'categoria_desconocida',
      estado: 'cerrado', created_at: '2025-01-02T00:00:00Z',
    };
    vi.mocked(ticketService.listarTickets).mockResolvedValue([testTicket] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total tickets'));
    fireEvent.click(screen.getByText('Total tickets'));
    await waitFor(() => screen.getByText('(sin asunto)'));
  });

  it('handles error when opening tickets panel fails', async () => {
    vi.mocked(ticketService.listarTickets).mockRejectedValue(new Error('fail'));
    renderPage();
    await waitFor(() => screen.getByText('Total tickets'));
    fireEvent.click(screen.getByText('Total tickets'));
    await waitFor(() => expect(vi.mocked(ticketService.listarTickets)).toHaveBeenCalled());
  });

  it('opens tickets abiertos panel via Abiertos KPI', async () => {
    vi.mocked(ticketService.listarTickets).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Abiertos'));
    fireEvent.click(screen.getByText('Abiertos'));
    await waitFor(() => expect(vi.mocked(ticketService.listarTickets)).toHaveBeenCalledWith('abierto'));
  });

  it('closes panel with DetailPanel X button', async () => {
    vi.mocked(userService.listarUsuarios).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Total registrados'));
    fireEvent.click(screen.getByText('Total registrados'));
    await waitFor(() => screen.getByText('No hay registros para mostrar.'));
    const closeBtn = screen.getByRole('button', { name: '' });
    // Click close (X) button in DetailPanel
    const xButton = document.querySelector('.flex-shrink-0.w-8.h-8') as HTMLElement;
    if (xButton) fireEvent.click(xButton);
    await waitFor(() => expect(screen.queryByText('No hay registros para mostrar.')).not.toBeInTheDocument());
  });

  it('opens Cuentas activas users panel via KPI click', async () => {
    vi.mocked(userService.listarUsuarios).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Cuentas activas'));
    fireEvent.click(screen.getByText('Cuentas activas'));
    await waitFor(() => expect(vi.mocked(userService.listarUsuarios)).toHaveBeenCalledWith({ is_active: true }));
  });

  it('opens Instituciones users panel via KPI click and filters client-side', async () => {
    const instUser = { id: 'u2', email: 'vet@test.cl', rol: 'veterinaria', tipo: 'institucion', is_active: true,
      institucion: { razon_social: 'Vet SA' } };
    const citizUser = { id: 'u1', email: 'c@test.cl', rol: 'ciudadano', tipo: 'ciudadano', is_active: true,
      ciudadano: { primer_nombre: 'Juan', apellido_paterno: 'García' } };
    vi.mocked(userService.listarUsuarios).mockResolvedValue([instUser, citizUser] as any);
    renderPage();
    await waitFor(() => screen.getByText('Instituciones'));
    fireEvent.click(screen.getByText('Instituciones'));
    await waitFor(() => expect(vi.mocked(userService.listarUsuarios)).toHaveBeenCalled());
    await waitFor(() => screen.getByText('Vet SA'));
    expect(screen.queryByText('Juan García')).not.toBeInTheDocument();
  });

  it('opens Perdidas reports panel via KPI click', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: [], total: 0 } as any);
    renderPage();
    await waitFor(() => screen.getByText('Perdidas'));
    fireEvent.click(screen.getByText('Perdidas'));
    await waitFor(() => expect(vi.mocked(listarReportes)).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'PERDIDA' })));
  });

  it('opens Encontradas reports panel via KPI click', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: [], total: 0 } as any);
    renderPage();
    await waitFor(() => screen.getByText('Encontradas'));
    fireEvent.click(screen.getByText('Encontradas'));
    await waitFor(() => expect(vi.mocked(listarReportes)).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'ENCONTRADA' })));
  });

  it('opens Resueltos reports panel via KPI click', async () => {
    vi.mocked(listarReportes).mockResolvedValue({ data: [], total: 0 } as any);
    renderPage();
    await waitFor(() => screen.getByText('Resueltos'));
    fireEvent.click(screen.getByText('Resueltos'));
    await waitFor(() => expect(vi.mocked(listarReportes)).toHaveBeenCalledWith(expect.objectContaining({ estado: 'RESUELTO' })));
  });

  it('renders HBarChart Sin datos when rolData is empty', async () => {
    vi.mocked(userService.getEstadisticas).mockResolvedValue({
      total: 100, activos: 80,
      por_tipo: [{ tipo: 'ciudadano', count: 70 }, { tipo: 'institucion', count: 30 }],
      por_tipo_institucion: [{ tipo_institucion: 'veterinaria', count: 20 }, { tipo_institucion: 'municipalidad', count: 10 }],
      por_rol: [],
      por_region: [],
      top_comunas: [],
    } as any);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Sin datos').length).toBeGreaterThan(0));
  });

  it('renders DonutChart Sin datos when all type counts are zero', async () => {
    vi.mocked(userService.getEstadisticas).mockResolvedValue({
      total: 0, activos: 0,
      por_tipo: [{ tipo: 'ciudadano', count: 0 }, { tipo: 'institucion', count: 0 }],
      por_tipo_institucion: [{ tipo_institucion: 'veterinaria', count: 0 }, { tipo_institucion: 'municipalidad', count: 0 }],
      por_rol: [],
      por_region: [],
      top_comunas: [],
    } as any);
    renderPage();
    await waitFor(() => expect(screen.getAllByText('Sin datos').length).toBeGreaterThan(0));
  });

  it('opens En proceso tickets panel via KPI click', async () => {
    vi.mocked(ticketService.listarTickets).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('En proceso'));
    fireEvent.click(screen.getByText('En proceso'));
    await waitFor(() => expect(vi.mocked(ticketService.listarTickets)).toHaveBeenCalledWith('en_proceso'));
  });

  it('renders with null user (covers user?. null branches on lines 432-433)', async () => {
    mockUser = null;
    renderPage();
    await waitFor(() => expect(screen.getByText('Bienvenido')).toBeInTheDocument());
  });

  it('renders ticket panel with unknown estado (covers lines 398-399 ?? fallbacks)', async () => {
    const unknownEstadoTicket = {
      id: 'tk99', asunto: 'Ticket extraño', categoria: 'otro',
      estado: 'estado_desconocido', created_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(ticketService.listarTickets).mockResolvedValue([unknownEstadoTicket] as any);
    renderPage();
    await waitFor(() => screen.getByText('Total tickets'));
    fireEvent.click(screen.getByText('Total tickets'));
    await waitFor(() => screen.getByText('Ticket extraño'));
    // Unknown estado falls back to raw value via ?? t.estado
    expect(screen.getByText('estado_desconocido')).toBeInTheDocument();
  });

  it('opens Tickets resueltos panel via KPI click', async () => {
    vi.mocked(ticketService.listarTickets).mockResolvedValue([]);
    renderPage();
    await waitFor(() => screen.getByText('Tickets resueltos'));
    fireEvent.click(screen.getByText('Tickets resueltos'));
    await waitFor(() => expect(vi.mocked(ticketService.listarTickets)).toHaveBeenCalledWith('resuelto'));
  });
});
