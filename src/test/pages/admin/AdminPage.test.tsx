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
  },
}));

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    getEstadisticas: vi.fn().mockResolvedValue({
      total: 50,
      por_estado: [{ estado: 'abierto', count: 20 }],
      por_categoria: [{ categoria: 'problema_tecnico', count: 25 }],
    }),
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
import { getEstadisticasReportes } from '../../../services/reporteService';

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
});
