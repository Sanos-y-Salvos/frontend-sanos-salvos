import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NuevoTicketPage from '../../../pages/soporte/NuevoTicketPage';

const mockNavigate = vi.fn();
let mockIsAuthenticated = true;
let mockUser: any = { email: 'user@test.cl' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated, user: mockUser }),
}));

vi.mock('../../../services/ticketService', () => ({
  ticketService: {
    crearTicket: vi.fn().mockResolvedValue(undefined),
    crearTicketPublico: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../../../components/layout/Navbar', () => ({ default: () => <nav>Navbar</nav> }));
vi.mock('../../../components/layout/Footer', () => ({ default: () => <footer>Footer</footer> }));
vi.mock('../../../components/layout/BotonVolver', () => ({
  default: ({ texto }: any) => <a href="/soporte">{texto}</a>,
}));

vi.mock('../../../components/ui/Input', () => ({
  default: ({ label, icon, ...props }: any) => (
    <div>
      <label>{typeof label === 'object' ? 'campo' : label}</label>
      <input aria-label={typeof label === 'object' ? 'campo' : label} {...props} />
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  default: ({ children }: any) => <div role="alert">{children}</div>,
}));

import { ticketService } from '../../../services/ticketService';
const mockTicketService = vi.mocked(ticketService);

const renderPage = () =>
  render(<MemoryRouter><NuevoTicketPage /></MemoryRouter>);

const fillAndSubmit = async (options: {
  categoria?: string;
  descripcion?: string;
  asunto?: string;
}) => {
  const { categoria = 'problema_tecnico', descripcion = 'Mi descripción del problema', asunto } = options;

  const catButton = screen.getByText(categoria === 'problema_tecnico' ? 'Problema técnico'
    : categoria === 'reporte_abuso' ? 'Reporte de abuso' : 'Otro');
  fireEvent.click(catButton);

  if (asunto) {
    await waitFor(() => screen.getByLabelText('campo'));
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: asunto } });
  }

  const textarea = screen.getByRole('textbox', { name: /descripción/i }) || document.querySelector('textarea');
  if (textarea) {
    fireEvent.change(textarea as HTMLElement, { target: { value: descripcion } });
  }

  fireEvent.submit(document.querySelector('form')!);
};

describe('NuevoTicketPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
    mockUser = { email: 'user@test.cl' };
    mockTicketService.crearTicket.mockResolvedValue(undefined as any);
    mockTicketService.crearTicketPublico.mockResolvedValue(undefined as any);
  });

  it('renders the form for authenticated user', () => {
    renderPage();
    expect(screen.getByText('Nuevo ticket')).toBeInTheDocument();
    expect(screen.getByText('user@test.cl')).toBeInTheDocument();
  });

  it('renders email input for unauthenticated user', () => {
    mockIsAuthenticated = false;
    mockUser = null;
    renderPage();
    expect(screen.getByPlaceholderText('tu@correo.cl')).toBeInTheDocument();
  });

  it('renders all category options', () => {
    renderPage();
    expect(screen.getByText('Problema técnico')).toBeInTheDocument();
    expect(screen.getByText('Reporte de abuso')).toBeInTheDocument();
    expect(screen.getByText('Otro')).toBeInTheDocument();
  });

  it('selects a category', () => {
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const button = screen.getByText('Problema técnico').closest('button');
    expect(button?.className).toContain('border-brand-400');
  });

  it('shows asunto field only when "Otro" is selected', async () => {
    renderPage();
    expect(screen.queryByLabelText('campo')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Otro'));
    await waitFor(() => expect(screen.getByLabelText('campo')).toBeInTheDocument());
  });

  it('clears asunto when switching from Otro to another category', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Otro'));
    await waitFor(() => screen.getByLabelText('campo'));
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'Mi asunto' } });
    fireEvent.click(screen.getByText('Problema técnico'));
    await waitFor(() => expect(screen.queryByLabelText('campo')).not.toBeInTheDocument());
  });

  it('submits ticket for authenticated user', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción del problema' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockTicketService.crearTicket).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Ticket creado')).toBeInTheDocument());
  });

  it('submits ticket for unauthenticated user', async () => {
    mockIsAuthenticated = false;
    mockUser = null;
    renderPage();

    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'pub@test.cl' } });
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción pública' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(mockTicketService.crearTicketPublico).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Ticket creado')).toBeInTheDocument());
  });

  it('shows error when email is missing for unauthenticated user', async () => {
    mockIsAuthenticated = false;
    mockUser = null;
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('El correo es requerido')
    );
  });

  it('shows error when "Otro" category has no asunto', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Otro'));
    await waitFor(() => screen.getByLabelText('campo'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'El asunto es requerido para la categoría "Otro"'
      )
    );
  });

  it('shows error when ticket creation fails', async () => {
    mockTicketService.crearTicket.mockRejectedValue(new Error('fail'));
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Error al crear el ticket')
    );
  });

  it('success state shows Ver mis tickets for authenticated user', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Desc' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => screen.getByText('Ticket creado'));
    expect(screen.getByText('Ver mis tickets')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver mis tickets'));
    expect(mockNavigate).toHaveBeenCalledWith('/tickets');
  });

  it('success state shows Ir al soporte button', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Problema técnico'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Desc' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => screen.getByText('Ticket creado'));
    fireEvent.click(screen.getByText('Ir al soporte'));
    expect(mockNavigate).toHaveBeenCalledWith('/soporte');
  });

  it('success state hides Ver mis tickets for unauthenticated user', async () => {
    mockIsAuthenticated = false;
    mockUser = null;
    renderPage();
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'pub@test.cl' } });
    fireEvent.click(screen.getByText('Reporte de abuso'));
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Desc' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => screen.getByText('Ticket creado'));
    expect(screen.queryByText('Ver mis tickets')).not.toBeInTheDocument();
  });

  it('submits Otro category with asunto for authenticated user', async () => {
    renderPage();
    fireEvent.click(screen.getByText('Otro'));
    await waitFor(() => screen.getByLabelText('campo'));
    fireEvent.change(screen.getByLabelText('campo'), { target: { value: 'Mi asunto' } });
    const textarea = document.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'Descripción larga' } });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(mockTicketService.crearTicket).toHaveBeenCalledWith(
        expect.objectContaining({ categoria: 'otro', asunto: 'Mi asunto' })
      )
    );
  });
});
